package main

import (
	"testing"
)

func Test_filtering(t *testing.T) {
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
		passed:      str != "7zip-min",
		packageName: str,
	}
}

func Test_parallelism(t *testing.T) {
	ans := makeResultMap([]string{"7zip-min", "ffprobe", "abbrev", "gaussian", "zipcodes"}, justReturn)
	if len(ans) == 0 {
		t.Error("Expected ans to have values.")
	}
	for k, v := range ans {
		if k == "7zip-min" && v == true {
			t.Error("Expected false v for 7zip-min")
		} else if k != "7zip-min" && v == false {
			t.Error("Expected everything else to be true")
		}
	}
}
