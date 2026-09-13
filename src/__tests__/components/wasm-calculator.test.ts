import {
  createJavaScriptRunner,
  expressionToJavaScript,
  parseExpression,
} from '../../components/WasmCalculator/expression'
import { compileWasmRunner } from '../../components/WasmCalculator/wasm'

describe('WasmCalculator expression parser', () => {
  test.each([
    ['1 + 2 * 3', '(1 + (2 * 3))'],
    ['(1 + 2) * 3', '((1 + 2) * 3)'],
    ['-1 + +2', '((-1) + 2)'],
    ['1e3 / 2.5', '(1000 / 2.5)'],
  ])('%s の優先順位を保つ', (source, expected) => {
    expect(expressionToJavaScript(parseExpression(source))).toBe(expected)
  })

  test.each([
    '',
    '1 +',
    '(1 + 2',
    '1 2',
    'Math.random()',
    'globalThis.alert(1)',
    '1 ** 2',
  ])('未対応または不完全な式 %s を拒否する', (source) => {
    expect(() => parseExpression(source)).toThrow()
  })
})

describe('JavaScript / Wasm runners', () => {
  test.each([
    '1 + 2 * 3',
    '(1 + 2) * (3 - 4) / 5',
    '-0.125 + 3.5 / 7',
    '1e6 / 3',
  ])('%s は同じ checksum を返す', async (source) => {
    const node = parseExpression(source)
    const javascriptRunner = createJavaScriptRunner(node)
    const wasmRunner = await compileWasmRunner(node)
    const iterations = 1_003

    expect(wasmRunner.run(iterations)).toBe(javascriptRunner(iterations))
    expect(wasmRunner.byteLength).toBeGreaterThan(0)
  })
})
