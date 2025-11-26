const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Replace patterns
content = content.replace(/courses\.map\(c =>/g, 'courses.map((c: any) =>');
content = content.replace(/lessons\.map\(l =>/g, 'lessons.map((l: any) =>');

// Write back
fs.writeFileSync('src/components/AdminPanel.tsx', content, 'utf8');

console.log('✅ Fixed AdminPanel.tsx');
