#!/usr/bin/env python3
lines = []
with open("SyntaxKind.txt") as the_file:
    lines = [line.strip() for line in the_file.readlines()]

print('import ts from "typescript"')
for line in lines:
    s = "${ts.SyntaxKind.%s}" % line
    print(f"console.log(`{s}: {line}`)")
