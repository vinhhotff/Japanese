// Script để thay thế speakText bằng speakTextSafely
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/VocabularyPractice.tsx',
  'src/components/ListeningSection.tsx',
  'src/components/Dictionary.tsx',
  'src/components/SavedWords.tsx',
  'src/components/SpacedRepetition.tsx',
  'src/components/AIRoleplayNew.tsx'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Thay thế import
    content = content.replace(
      /import\s*\{([^}]*)\bspeakText\b([^}]*)\}\s*from\s*['"][^'"]*speech['"];?/g,
      (match, before, after) => {
        const newImport = before.replace(/speakText/g, 'speakTextSafely') + 
                         'speakTextSafely' + 
                         after.replace(/speakText/g, '');
        return match.replace(/\{[^}]*\}/, `{${newImport}}`);
      }
    );
    
    // Thay thế usage
    content = content.replace(/\bspeakText\(/g, 'speakTextSafely(');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Speech import fix completed!');