import { defineConfig } from 'vitest/config'

// math-kb の vitest.config.ts と同じ構成に揃える (anozon 系リポでテスト方法を共通化)。
// 意図的な差分は pool のみ
export default defineConfig({
  // Rolldown の既定は classic JSX で、テストが import する .tsx が
  // "Unexpected JSX expression" で落ちる (esbuild.jsx は Rolldown では効かない)
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    globals: true,
    // threads は tools で forks と交互に 3 回測って毎回 0.6〜1.4s 速かったので採用 (テスト本体が重いため)。
    // math-kb は計測で差が出ず (med 1695 vs 1701ms)、worker_threads の制約を避けて既定の forks のまま
    pool: 'threads',
    environment: 'node',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
})
