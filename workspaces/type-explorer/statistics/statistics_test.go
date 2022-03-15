package main

import (
	"testing"
)

func test_filtering(t *testing.T) {
	ans := map[string]bool{
		"hello":   true,
		"goodbye": false,
		"apple":   true,
	}
	res := filterPassed(ans)
	if res.passed != 2 {
		t.Error("Failed to count number passed correctly.")
	}
	if res.failed != 1 {
		t.Error("Failed to count number failed correctly.")
	}
	if len(res.result) != 2 {
		t.Error("Failed to collect passing package names.")
	}
}

func justReturn(str string) ScriptResult {
	return ScriptResult{
		passed:      true,
		packageName: str,
	}
}

func test_parallelism(t *testing.T) {
	ans := makeResultMap([]string{"7zip-min", "ffprobe", "abbrev", "gaussian", "zipcodes"}, justReturn)
	for _, v := range ans {
		if !v {
			t.Error("Expected parallelism not to interfere with results")
		}
	}

}
