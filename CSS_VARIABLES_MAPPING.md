# CSS Variables Mapping - Old to New

## Cần thay thế trong tất cả components:

### Background Colors:
- `var(--color-bg-primary)` → `var(--bg-color)`
- `var(--color-bg-secondary)` → `var(--bg-secondary)`

### Text Colors:
- `var(--color-text-primary)` → `var(--text-primary)`
- `var(--color-text-secondary)` → `var(--text-secondary)`
- `var(--color-text-muted)` → `var(--text-tertiary)`

### Border Colors:
- `var(--color-border)` → `var(--border-color)`

### Other Colors:
- `var(--color-success)` → `var(--success-color)`
- `var(--color-danger)` → `var(--danger-color)`
- `var(--color-warning)` → `var(--warning-color)`

### Spacing (optional - có thể giữ hoặc thay bằng giá trị cụ thể):
- `var(--space-sm)` → `0.5rem`
- `var(--space-md)` → `0.75rem`
- `var(--space-lg)` → `1rem`
- `var(--space-xl)` → `1.5rem`
- `var(--space-2xl)` → `2rem`
- `var(--space-3xl)` → `3rem`

### Border Radius:
- `var(--radius-sm)` → `8px`
- `var(--radius-md)` → `12px`
- `var(--radius-lg)` → `16px`

### Container Classes:
- `.container-custom` → `.container`
- `.card-custom` → `.card`

## Files cần fix:
1. ✅ LessonListNew.tsx - DONE
2. ❌ AIRoleplay.tsx
3. ❌ LessonDetail.tsx
4. ❌ VocabularySection.tsx
5. ❌ KanjiSection.tsx
6. ❌ GrammarSection.tsx
7. ❌ ListeningSection.tsx
8. ❌ SpeakingSection.tsx
9. ❌ Flashcard.tsx
10. ❌ Quiz.tsx
11. ❌ Roleplay.tsx
12. ❌ Pronunciation.tsx
13. ❌ Shadowing.tsx
