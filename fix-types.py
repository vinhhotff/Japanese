#!/usr/bin/env python3
import re

# Read the file
with open('src/components/AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace patterns
content = re.sub(r'courses\.map\(c =>', 'courses.map((c: any) =>', content)
content = re.sub(r'lessons\.map\(l =>', 'lessons.map((l: any) =>', content)

# Write back
with open('src/components/AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed AdminPanel.tsx")
