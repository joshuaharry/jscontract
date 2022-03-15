package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"strings"
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
	// For up to 10 packages at a time, run METHOD with a 3 minute timeout. When you get a result,
	// store it into the answer map.
	for _, packageName := range packages {
		res := method(packageName)
		ans[res.packageName] = res.passed
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

func main() {
	setup()
	// packages := initialPackagesList()
	makeResultMap([]string{"7zip-min", "ffprobe", "abbrev", "gaussian", "zipcodes"}, checkCompatability)
	// checkCompatability("7zip-min")
	// checkDisabledContract("7zip-min")
	// checkEnabledContract("7zip-min")
	note("Done.")
}
