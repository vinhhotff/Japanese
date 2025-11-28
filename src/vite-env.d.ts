/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_DEEPSEEK_API_KEY?: string
  readonly VITE_HUGGINGFACE_API_KEY?: string
  readonly VITE_QWEN_API_KEY?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_AI_PROVIDER?: 'openai' | 'gemini' | 'deepseek' | 'huggingface' | 'qwen' | 'openrouter'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
