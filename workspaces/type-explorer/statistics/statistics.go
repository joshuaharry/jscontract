package main

import (
	"errors"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

var VERBOSE bool = false
var SANDBOX string = "sandbox"
var RANDOM_TESTING string = "random_testing"
var PACKAGE_COMPATABILITY string = "package_compatability"
var DISABLED_CONTRACTS string = "disabled_contracts"
var ENABLED_CONTRACTS string = "enabled_contracts"
var NO_CONTRACTS string = "no_contracts"
var COMMIT string = "998fe1077af548a7c97fcee5f2057bdb04d3855c"
var SCRIPT string = "ct"
var MAX_PROCESSES int = 8

func try(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func cleanSandbox() {
	try(os.RemoveAll(SANDBOX))
	try(os.Mkdir(SANDBOX, 0777))
}

func fetchDefinitelyTyped() {
	_, err := os.Stat("DefinitelyTyped")
	if err == nil {
		return
	}
	log.Println("Cloning DefinitelyTyped...")
	try(exec.Command("git", "clone", "https://github.com/DefinitelyTyped/DefinitelyTyped").Run())
	try(os.Chdir("DefinitelyTyped"))
	try(exec.Command("git", "checkout", COMMIT).Run())
	try(os.Chdir(".."))
	log.Println("Type declarations downloaded.")
}

func setup() {
	os.Mkdir(RANDOM_TESTING, 0777)
	fetchDefinitelyTyped()
}

func initialPackagesList() []string {
	log.Println(os.Args)
	var pkgs []string
	if len(os.Args) <= 1 {
		files, err := ioutil.ReadDir(strings.Join([]string{"DefinitelyTyped", "types"}, string(os.PathSeparator)))
		if err != nil {
			log.Fatal(err)
		}
		for _, f := range files {
			pkgs = append(pkgs, f.Name())
		}
		return pkgs
	}
	bytes, err := ioutil.ReadFile(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	str := string(bytes)
	res := strings.Split(str, "\n")
	for _, pkg := range res {
		if pkg != "" {
			pkgs = append(pkgs, pkg)
		}
	}
	return pkgs
}

type ScriptConfig struct {
	packageName    string
	scriptArgument string
	dirName        string
	timeout        int
}

func (config ScriptConfig) path() string {
	return strings.Join([]string{config.dirName, config.packageName}, string(os.PathSeparator))
}

type ScriptResult struct {
	passed      bool
	packageName string
}

func (res ScriptResult) cleanup() {
	var removeDir string
	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatalln(err)
	}
	removeDir = strings.Join([]string{home, "ReaGenT", "test", "benchmarks", res.packageName}, string(os.PathSeparator))
	os.RemoveAll(removeDir)
}

type CmdResult struct {
	message string
	error   error
}

func (cmd CmdResult) bytes() []byte {
	out := cmd.message
	if cmd.error != nil {
		out += "\n" + cmd.error.Error()
	}
	return []byte(out)
}

func outputResult(cmd *exec.Cmd) CmdResult {
	out, err := cmd.CombinedOutput()
	errorString := ""
	if err != nil {
		errorString = err.Error()
	}
	message := string(out) + "\n" + errorString
	return CmdResult{
		message: message,
		error:   err,
	}

}

func output(cmd *exec.Cmd, timeoutInMinutes int) CmdResult {
	timeout := make(chan CmdResult, 1)
	go func() {
		answer := outputResult(cmd)
		timeout <- answer
	}()
	select {
	case res := <-timeout:
		return res
	case <-time.After(time.Duration(timeoutInMinutes) * time.Minute):
		return CmdResult{
			message: "Timeout.",
			error:   errors.New("fatal timeout"),
		}
	}
}

func (config ScriptConfig) run() ScriptResult {
	log.Println(config.packageName, ": running", config.scriptArgument)
	cmd := exec.Command(SCRIPT, config.packageName, config.scriptArgument)
	out := output(cmd, config.timeout)
	os.WriteFile(config.path(), out.bytes(), 0644)
	log.Println(config.packageName, ": finished", config.scriptArgument)
	return ScriptResult{
		packageName: config.packageName,
		passed:      out.error == nil,
	}
}

func randomTesting(packageName string) ScriptResult {
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "",
		dirName:        RANDOM_TESTING,
		timeout:        3,
	}.run()
	res.cleanup()
	return res
}

func checkCompatability(packageName string) ScriptResult {
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--check-testability",
		dirName:        PACKAGE_COMPATABILITY,
		timeout:        2,
	}.run()
	res.cleanup()
	return res
}

func checkNoContract(packageName string) ScriptResult {
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--nocontract",
		dirName:        NO_CONTRACTS,
		timeout:        5,
	}.run()
	return res
}

func checkDisabledContract(packageName string) ScriptResult {
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--disabledcontract",
		dirName:        DISABLED_CONTRACTS,
		timeout:        5,
	}.run()
	return res
}

func checkEnabledContract(packageName string) ScriptResult {
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--enabled-contracts",
		dirName:        ENABLED_CONTRACTS,
		timeout:        5,
	}.run()
	return res
}

func makeResultMap(packages []string, method func(string) ScriptResult) map[string]bool {
	ans := make(map[string]bool, len(packages))
	// jobs is a channel that functions as a queue of packages to analyze.
	jobs := make(chan string, MAX_PROCESSES)
	// results is a channel that holds the results of the computations we do in parallel.
	results := make(chan ScriptResult, len(packages))
	// wg is a WaitGroup that we increment whenever we start work so that we make sure
	// all of our jobs eventually finish.
	wg := sync.WaitGroup{}
	for _, pkg := range packages {
		// Add a job onto the queue.
		jobs <- pkg
		wg.Add(1)
		go func(name string) {
			// Analyze the package, clean it up, and add the result.
			res := method(name)
			// Remove a job from the queue. If the queue is full, this will block,
			// ensuring that we don't run more than MAX_PROCESSES at a time.
			<-jobs
			res.cleanup()
			results <- res
			// Decrement the wait group.
			wg.Done()
		}(pkg)
	}
	// Wait for the wait group to finish.
	wg.Wait()
	// Cleanup.
	close(jobs)
	close(results)
	// Store everything in a map.
	for result := range results {
		ans[result.packageName] = result.passed
	}
	return ans
}

type FilterResult struct {
	passed int
	failed int
	result []string
}

func filterPassed(answerMap map[string]bool) FilterResult {
	passed := 0
	failed := 0
	result := []string{}
	for k, v := range answerMap {
		if v {
			result = append(result, k)
			passed++
		} else {
			failed++
		}
	}
	return FilterResult{passed, failed, result}
}

func chainSteps(packages []string, steps [](func(string) ScriptResult)) {
	curPackages := packages
	for i, step := range steps {
		stepNum := i + 1
		log.Println("Beginning step", stepNum, "processing", len(curPackages), "packages")
		res := filterPassed(makeResultMap(curPackages, step))
		curPackages = res.result
		log.Println("Step", stepNum, "complete:", res.passed, "passed", res.failed, "failed")
	}
}

func main() {
	setup()
	packages := initialPackagesList()
	chainSteps(
		packages,
		[]func(string) ScriptResult{randomTesting},
	)
}
