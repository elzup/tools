import type {
  BenchmarkRunner,
  BinaryOperator,
  ExpressionNode,
} from './expression'

export type CompiledWasmRunner = {
  run: BenchmarkRunner
  compilationMs: number
  byteLength: number
}

const VALUE_TYPE = {
  i32: 0x7f,
  f64: 0x7c,
} as const

const OPCODE = {
  block: 0x02,
  loop: 0x03,
  end: 0x0b,
  branch: 0x0c,
  branchIf: 0x0d,
  localGet: 0x20,
  localSet: 0x21,
  i32Const: 0x41,
  f64Const: 0x44,
  i32GreaterThanOrEqualUnsigned: 0x4f,
  i32Add: 0x6a,
  f64Negate: 0x9a,
  f64Add: 0xa0,
  f64Subtract: 0xa1,
  f64Multiply: 0xa2,
  f64Divide: 0xa3,
} as const

const EMPTY_BLOCK_TYPE = 0x40
const ITERATIONS_LOCAL = 0
const INDEX_LOCAL = 1
const CHECKSUM_LOCAL = 2

const encodeU32 = (value: number): number[] => {
  let remaining = value >>> 0
  let bytes: number[] = []

  do {
    const byte = remaining & 0x7f
    remaining >>>= 7
    bytes = [...bytes, remaining === 0 ? byte : byte | 0x80]
  } while (remaining !== 0)

  return bytes
}

const encodeF64 = (value: number): number[] => {
  // Wasm の即値は little-endian の IEEE 754 バイト列でなければならない。
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setFloat64(0, value, true)
  return [...new Uint8Array(buffer)]
}

const encodeName = (name: string): number[] => {
  // Wasm の export 名は固定 ASCII のみなので、TextEncoder 非搭載の test 環境でも直接符号化できる。
  const bytes = [...name].map((character) => character.charCodeAt(0))
  return [...encodeU32(bytes.length), ...bytes]
}

const makeSection = (id: number, payload: number[]): number[] => [
  id,
  ...encodeU32(payload.length),
  ...payload,
]

const operatorOpcode = (operator: BinaryOperator): number => {
  if (operator === '+') return OPCODE.f64Add
  if (operator === '-') return OPCODE.f64Subtract
  if (operator === '*') return OPCODE.f64Multiply
  return OPCODE.f64Divide
}

const encodeExpression = (node: ExpressionNode): number[] => {
  if (node.kind === 'number') return [OPCODE.f64Const, ...encodeF64(node.value)]
  if (node.kind === 'unary')
    return [...encodeExpression(node.operand), OPCODE.f64Negate]

  return [
    ...encodeExpression(node.left),
    ...encodeExpression(node.right),
    operatorOpcode(node.operator),
  ]
}

const makeTypeSection = (): number[] =>
  makeSection(1, [0x01, 0x60, 0x01, VALUE_TYPE.i32, 0x01, VALUE_TYPE.f64])

const makeFunctionSection = (): number[] => makeSection(3, [0x01, 0x00])

const makeExportSection = (): number[] =>
  makeSection(7, [0x01, ...encodeName('run'), 0x00, 0x00])

const makeFunctionBody = (node: ExpressionNode): number[] => {
  const locals = [0x02, 0x01, VALUE_TYPE.i32, 0x01, VALUE_TYPE.f64]
  const instructions = [
    OPCODE.i32Const,
    0x00,
    OPCODE.localSet,
    INDEX_LOCAL,
    OPCODE.f64Const,
    ...encodeF64(0),
    OPCODE.localSet,
    CHECKSUM_LOCAL,
    OPCODE.block,
    EMPTY_BLOCK_TYPE,
    OPCODE.loop,
    EMPTY_BLOCK_TYPE,
    OPCODE.localGet,
    INDEX_LOCAL,
    OPCODE.localGet,
    ITERATIONS_LOCAL,
    OPCODE.i32GreaterThanOrEqualUnsigned,
    OPCODE.branchIf,
    0x01,
    OPCODE.localGet,
    CHECKSUM_LOCAL,
    ...encodeExpression(node),
    OPCODE.f64Add,
    OPCODE.localSet,
    CHECKSUM_LOCAL,
    OPCODE.localGet,
    INDEX_LOCAL,
    OPCODE.i32Const,
    0x01,
    OPCODE.i32Add,
    OPCODE.localSet,
    INDEX_LOCAL,
    OPCODE.branch,
    0x00,
    OPCODE.end,
    OPCODE.end,
    OPCODE.localGet,
    CHECKSUM_LOCAL,
    OPCODE.end,
  ]
  return [...locals, ...instructions]
}

const makeCodeSection = (node: ExpressionNode): number[] => {
  const body = makeFunctionBody(node)
  return makeSection(10, [0x01, ...encodeU32(body.length), ...body])
}

export const buildWasmModule = (node: ExpressionNode): Uint8Array =>
  Uint8Array.from([
    0x00,
    0x61,
    0x73,
    0x6d,
    0x01,
    0x00,
    0x00,
    0x00,
    ...makeTypeSection(),
    ...makeFunctionSection(),
    ...makeExportSection(),
    ...makeCodeSection(node),
  ])

export const compileWasmRunner = async (
  node: ExpressionNode
): Promise<CompiledWasmRunner> => {
  const bytes = buildWasmModule(node)
  const startedAt = performance.now()
  const module = await WebAssembly.compile(bytes.buffer as ArrayBuffer)
  const instance = await WebAssembly.instantiate(module)
  const compilationMs = performance.now() - startedAt
  const run = instance.exports.run

  if (typeof run !== 'function')
    throw new Error('Wasm の run 関数を読み込めませんでした')

  return {
    run: run as BenchmarkRunner,
    compilationMs,
    byteLength: bytes.byteLength,
  }
}
