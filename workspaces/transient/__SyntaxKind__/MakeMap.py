lines = []
with open("SyntaxTranslations.txt") as the_file:
    lines = [line.strip() for line in the_file.readlines()]

print("const SyntaxMap = {")
for line in lines:
    idx, token = line.split(": ")
    print(f'  {idx}: "{token}",')
print("}")
