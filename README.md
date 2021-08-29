# JSContract
Tooling related to JavaScript, types, and contracts.

# Running the System

## External Dependencies
You will need:
- `bash` (or another POSIX shell symlinked to `/bin/sh`)
- `node`
- `jq`
- `git`

If you're on a Unixy system, most things should work out of the box.

## Getting Started
Clone this repository onto your machine. Then, `cd` into it and run:

```sh
npm install
```

From there, you can run our system by doing:

```sh
./workspaces/type-explorer/bin/ct $PACKAGE_NAME
```

Where `$PACKAGE_NAME` is a package on DefinitelyTyped you would like to test.
