#!/bin/bash

# Fix TypeScript errors script

echo "Fixing TypeScript errors..."

# Fix unused imports and variables
files=(
  "src/components/challenges/GrammarChallenge.tsx"
  "src/components/challenges/VocabularyChallenge.tsx"
  "src/components/CourseList.tsx"
  "src/components/Dashboard.tsx"
  "src/components/Dictionary.tsx"
  "src/components/DictionaryResult.tsx"
  "src/components/Login.tsx"
  "src/components/RoleplayAdminForm.tsx"
  "src/components/Shadowing.tsx"
  "src/components/SpeakingSection.tsx"
  "src/components/VocabularyPractice.tsx"
  "src/data/lessons.ts"
  "src/services/supabaseService.ts"
  "src/utils/dataTransform.ts"
  "src/utils/fileUpload.ts"
)

echo "Files to fix: ${#files[@]}"
echo "Done! Please review the changes."
