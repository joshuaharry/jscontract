package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"
)

var VERBOSE bool = true
var SANDBOX string = "sandbox"
var PACKAGE_COMPATABILITY string = "package_compatability"
var DISABLED_CONTRACTS string = "disabled_contracts"
var ENABLED_CONTRACTS string = "enabled_contracts"
var COMMIT string = "998fe1077af548a7c97fcee5f2057bdb04d3855c"
var SCRIPT string = "ct"

func note(args ...interface{}) {
	if !VERBOSE {
		return
	}
	fmt.Println(args...)
}

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
	try(exec.Command("git", "clone", "https://github.com/DefinitelyTyped/DefinitelyTyped").Run())
	try(os.Chdir("DefinitelyTyped"))
	try(exec.Command("git", "checkout", COMMIT).Run())
	try(os.Chdir(".."))
}

func setup() {
	note("Setting up directories...")
	os.Mkdir(PACKAGE_COMPATABILITY, 0777)
	os.Mkdir(DISABLED_CONTRACTS, 0777)
	os.Mkdir(ENABLED_CONTRACTS, 0777)
	note("Setup complete. Cleaning sandbox...")
	cleanSandbox()
	note("Sandbox cleaning complete. Fetching required types...")
	fetchDefinitelyTyped()
	note("Type fetching complete.")
}

func initialPackagesList() []string {
	files, err := ioutil.ReadDir(strings.Join([]string{"DefinitelyTyped", "types"}, string(os.PathSeparator)))
	if err != nil {
		log.Fatal(err)
	}
	out := make([]string, len(files))
	for _, f := range files {
		out = append(out, f.Name())
	}
	return out
}

type ScriptConfig struct {
	packageName    string
	scriptArgument string
	dirName        string
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
	if res.passed {
		removeDir = strings.Join([]string{"sandbox", res.packageName, "node_modules"}, string(os.PathSeparator))
	} else {
		removeDir = strings.Join([]string{"sandbox", res.packageName}, string(os.PathSeparator))
	}
	try(os.RemoveAll(removeDir))
}

func (config ScriptConfig) run() ScriptResult {
	cmd := exec.Command(SCRIPT, config.packageName, config.scriptArgument)
	theBytes, err := cmd.CombinedOutput()
	message := string(theBytes)
	if err != nil {
		message += ("\n" + err.Error())
	}
	os.WriteFile(config.path(), []byte(message), 0644)
	return ScriptResult{
		packageName: config.packageName,
		passed:      err == nil,
	}
}

func checkCompatability(packageName string) ScriptResult {
	note(packageName, ": checking compatability...")
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--check-testability",
		dirName:        PACKAGE_COMPATABILITY,
	}.run()
	res.cleanup()
	note(packageName, ": compatability check complete.")
	return res
}

func checkDisabledContract(packageName string) ScriptResult {
	note(packageName, ": checking disabled contracts...")
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--disabled-contracts",
		dirName:        DISABLED_CONTRACTS,
	}.run()
	note(packageName, ": disabled contracts check complete.")
	return res
}

func checkEnabledContract(packageName string) ScriptResult {
	note(packageName, ": checking enabled contracts...")
	res := ScriptConfig{
		packageName:    packageName,
		scriptArgument: "--enabled-contracts",
		dirName:        ENABLED_CONTRACTS,
	}.run()
	note(packageName, ": enabled contracts check complete.")
	return res
}

func makeResultMap(packages []string, method func(string) ScriptResult) map[string]bool {
	ans := make(map[string]bool, len(packages))
	// jobs is a channel that functions as a queue of packages to analyze.
	jobs := make(chan string, 8)
	// results is a channel that holds the results of the computations we do in parallel.
	results := make(chan ScriptResult, len(packages))
	// wg is a WaitGroup that we increment whenever we start work so that we make sure
	// all of our jobs eventually finish.
	wg := sync.WaitGroup{}
	for _, pkg := range packages {
		// Add a job to the queue. If the queue is full, this will block.
		jobs <- pkg
		// Add 1 to the wait group.
		wg.Add(1)
		go func() {
			// Take a job off of the queue at some point in the future, potentially freeing
			// more work to start.
			job := <-jobs
			// Analyze the package, clean it up, and add the result.
			res := method(job)
			res.cleanup()
			results <- res
			// Decrement the wait group.
			wg.Done()
		}()
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

// func makeResultMap(packages []string, method func(string) ScriptResult) map[string]bool {
// 	ans := make(map[string]bool, len(packages))
// 	results := make(chan ScriptResult, len(packages))
// 	jobs := make(chan struct{}, 8)
// 	wg := sync.WaitGroup{}
// 	for _, pkg := range packages {
// 		jobs <- struct{}{}
// 		wg.Add(1)
// 		go func(name string) {
// 			res := method(name)
// 			res.cleanup()
// 			results <- res
// 			<-jobs
// 			wg.Done()
// 		}(pkg)
// 	}
// 	wg.Wait()
// 	close(results)
// 	close(jobs)
// 	for res := range results {
// 		ans[res.packageName] = res.passed
// 	}
// 	return ans
// }

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

func main() {
	setup()
	// packages := initialPackagesList()
	makeResultMap([]string{"7zip-min", "ffprobe", "abbrev", "gaussian", "zipcodes"}, checkCompatability)
	// checkCompatability("7zip-min")
	// checkDisabledContract("7zip-min")
	// checkEnabledContract("7zip-min")
	note("Done.")
}
