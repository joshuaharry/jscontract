# ct

A shell script for detecting bugs with TypeScript types.

## Getting Started

### Dependencies

You will need:

- A Unix based operating system (e.g., Mac OS, Linux, or the WSL)
- Bash
- node.js v12+
- npm v7+
- [jq](https://stedolan.github.io/jq/)

You will also probably want to put the file `ct` on your `$PATH` so that you can run it more freely. To do so, while in this directory, run:

PATH="$PWD"/bin:"$PATH"

Please do not change the location of ct, as **moving ct outside the bin folder will break the script.**

### Health Check

To make sure that the system is working correctly on your computer, first ensure that the last line of the `./bin/ct` script is "do_contract \"$@\"". From there, when you run:

```sh
ct caseless
```

You should see an error that looks like:

```sh
TypeError: Object mismatch, expecting "{set, has, get, swap, del}", got "{dict, set, has, get, swap, del}"
```

If that message appears, then congratulations! The system is working properly on your machine.

## Usage

### Finding Bugs

The simplest way to check whether our system can detect a bug in a package is to run:

```sh
ct $PACKAGE_NAME
```

Where `$PACKAGE_NAME` is the name of a package on npm, like `express` or `react`.

### Compatability

If you want to know whether a package on npm is compatible with our system, change the last line of `./bin/ct` from:

```sh
do_contract "$@"
```

To:

```sh
do_check "$@"
```

That will check that downloading the package from `npm` and invoking `npm test` will exit with a nonzero exit code.

### Where do I start looking?

For a list of packages that may contain bugs, consider looking through the ./failures.txt file. Note that the file contains a number of false positives and packages that have since been patched; it is only a starting point.
