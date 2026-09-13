import {
  type BenchmarkRunner,
  createJavaScriptRunner,
  parseExpression,
} from './expression'
import { compileWasmRunner } from './wasm'

export type EngineResult = {
  medianMs: number
  opsPerSecond: number
  samplesMs: number[]
  checksum: number
}

export type BenchmarkResult = {
  expression: string
  iterations: number
  sampleCount: number
  javascript: EngineResult
  wasm: EngineResult
  wasmCompilationMs: number
  wasmByteLength: number
  wasmSpeedup: number
  hasMatchingChecksum: boolean
}

type Measurement = {
  elapsedMs: number
  checksum: number
}

type EngineName = 'javascript' | 'wasm'

const MIN_EXPONENT = 4
const MAX_EXPONENT = 8
const WARMUP_ITERATIONS = 10_000
const DEFAULT_SAMPLE_COUNT = 5
// 10^8 は 5 サンプルだと低速端末を長時間占有するため、中央値を出せる最小の 3 回に抑える。
const HIGH_LOAD_SAMPLE_COUNT = 3
const HIGH_LOAD_ITERATIONS = 100_000_000

const measure = (runner: BenchmarkRunner, iterations: number): Measurement => {
  const startedAt = performance.now()
  const checksum = runner(iterations)
  return { elapsedMs: performance.now() - startedAt, checksum }
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

const makeEngineResult = (
  samplesMs: number[],
  checksum: number,
  iterations: number
): EngineResult => {
  const medianMs = median(samplesMs)
  return {
    medianMs,
    opsPerSecond: iterations / (medianMs / 1000),
    samplesMs,
    checksum,
  }
}

const checksumsMatch = (left: number, right: number): boolean =>
  Object.is(left, right) ||
  (Number.isNaN(left) && Number.isNaN(right)) ||
  Math.abs(left - right) <=
    Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right))

export const runBenchmark = async (
  expression: string,
  exponent: number
): Promise<BenchmarkResult> => {
  if (
    !Number.isInteger(exponent) ||
    exponent < MIN_EXPONENT ||
    exponent > MAX_EXPONENT
  )
    throw new Error(
      `繰り返し回数 n は ${MIN_EXPONENT}〜${MAX_EXPONENT} にしてください`
    )

  const node = parseExpression(expression)
  const iterations = 10 ** exponent
  const javascriptRunner = createJavaScriptRunner(node)
  const compiledWasm = await compileWasmRunner(node)
  const warmupIterations = Math.min(iterations, WARMUP_ITERATIONS)
  javascriptRunner(warmupIterations)
  compiledWasm.run(warmupIterations)

  const sampleCount =
    iterations >= HIGH_LOAD_ITERATIONS
      ? HIGH_LOAD_SAMPLE_COUNT
      : DEFAULT_SAMPLE_COUNT
  let javascriptSamples: number[] = []
  let wasmSamples: number[] = []
  let javascriptChecksum = 0
  let wasmChecksum = 0

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    // 先に走る側だけが CPU ブースト等で有利にならないよう、サンプルごとに順序を反転する。
    const order: EngineName[] =
      sampleIndex % 2 === 0 ? ['javascript', 'wasm'] : ['wasm', 'javascript']

    for (const engine of order) {
      const measurement = measure(
        engine === 'javascript' ? javascriptRunner : compiledWasm.run,
        iterations
      )
      if (engine === 'javascript') {
        javascriptSamples = [...javascriptSamples, measurement.elapsedMs]
        javascriptChecksum = measurement.checksum
      } else {
        wasmSamples = [...wasmSamples, measurement.elapsedMs]
        wasmChecksum = measurement.checksum
      }
    }
  }

  const javascript = makeEngineResult(
    javascriptSamples,
    javascriptChecksum,
    iterations
  )
  const wasm = makeEngineResult(wasmSamples, wasmChecksum, iterations)

  return {
    expression,
    iterations,
    sampleCount,
    javascript,
    wasm,
    wasmCompilationMs: compiledWasm.compilationMs,
    wasmByteLength: compiledWasm.byteLength,
    wasmSpeedup: javascript.medianMs / wasm.medianMs,
    hasMatchingChecksum: checksumsMatch(javascriptChecksum, wasmChecksum),
  }
}
