export type BinaryOperator = '+' | '-' | '*' | '/'

export type ExpressionNode =
  | { kind: 'number'; value: number }
  | { kind: 'unary'; operand: ExpressionNode }
  | {
      kind: 'binary'
      operator: BinaryOperator
      left: ExpressionNode
      right: ExpressionNode
    }

export type BenchmarkRunner = (iterations: number) => number

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'operator'; value: BinaryOperator }
  | { kind: 'leftParen' }
  | { kind: 'rightParen' }

type ParseResult = {
  node: ExpressionNode
  nextIndex: number
}

const MAX_EXPRESSION_LENGTH = 200
const NUMBER_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/

const tokenize = (source: string): Token[] => {
  if (source.trim().length === 0) throw new Error('計算式を入力してください')
  if (source.length > MAX_EXPRESSION_LENGTH)
    throw new Error(`計算式は ${MAX_EXPRESSION_LENGTH} 文字以内にしてください`)

  let tokens: Token[] = []
  let index = 0

  while (index < source.length) {
    const rest = source.slice(index)
    const character = source[index]

    if (/\s/.test(character)) {
      index += 1
      continue
    }

    if ('+-*/'.includes(character)) {
      tokens = [
        ...tokens,
        { kind: 'operator', value: character as BinaryOperator },
      ]
      index += 1
      continue
    }

    if (character === '(' || character === ')') {
      tokens = [
        ...tokens,
        { kind: character === '(' ? 'leftParen' : 'rightParen' },
      ]
      index += 1
      continue
    }

    const match = rest.match(NUMBER_PATTERN)
    if (match === null) throw new Error(`未対応の文字です: ${character}`)

    const value = Number(match[0])
    if (!Number.isFinite(value)) throw new Error('有限の数値だけを使用できます')
    tokens = [...tokens, { kind: 'number', value }]
    index += match[0].length
  }

  return tokens
}

const parsePrimary = (tokens: Token[], startIndex: number): ParseResult => {
  const token = tokens[startIndex]
  if (token === undefined) throw new Error('数値または括弧内の式が必要です')

  if (token.kind === 'number') {
    return {
      node: { kind: 'number', value: token.value },
      nextIndex: startIndex + 1,
    }
  }

  if (token.kind !== 'leftParen')
    throw new Error('数値または開き括弧が必要です')

  const inner = parseAdditive(tokens, startIndex + 1)
  if (tokens[inner.nextIndex]?.kind !== 'rightParen')
    throw new Error('閉じ括弧がありません')

  return { node: inner.node, nextIndex: inner.nextIndex + 1 }
}

const parseUnary = (tokens: Token[], startIndex: number): ParseResult => {
  const token = tokens[startIndex]
  if (
    token?.kind !== 'operator' ||
    (token.value !== '-' && token.value !== '+')
  )
    return parsePrimary(tokens, startIndex)

  const operand = parseUnary(tokens, startIndex + 1)
  if (token.value === '+') return operand

  return {
    node: { kind: 'unary', operand: operand.node },
    nextIndex: operand.nextIndex,
  }
}

const parseMultiplicative = (
  tokens: Token[],
  startIndex: number
): ParseResult => {
  let result = parseUnary(tokens, startIndex)

  while (true) {
    const token = tokens[result.nextIndex]
    if (
      token?.kind !== 'operator' ||
      (token.value !== '*' && token.value !== '/')
    )
      return result

    const right = parseUnary(tokens, result.nextIndex + 1)
    result = {
      node: {
        kind: 'binary',
        operator: token.value,
        left: result.node,
        right: right.node,
      },
      nextIndex: right.nextIndex,
    }
  }
}

const parseAdditive = (tokens: Token[], startIndex: number): ParseResult => {
  let result = parseMultiplicative(tokens, startIndex)

  while (true) {
    const token = tokens[result.nextIndex]
    if (
      token?.kind !== 'operator' ||
      (token.value !== '+' && token.value !== '-')
    )
      return result

    const right = parseMultiplicative(tokens, result.nextIndex + 1)
    result = {
      node: {
        kind: 'binary',
        operator: token.value,
        left: result.node,
        right: right.node,
      },
      nextIndex: right.nextIndex,
    }
  }
}

export const parseExpression = (source: string): ExpressionNode => {
  const tokens = tokenize(source)
  const result = parseAdditive(tokens, 0)
  if (result.nextIndex !== tokens.length)
    throw new Error('式の末尾を解釈できません')
  return result.node
}

const numberToJavaScript = (value: number) =>
  Object.is(value, -0) ? '-0' : String(value)

export const expressionToJavaScript = (node: ExpressionNode): string => {
  if (node.kind === 'number') return numberToJavaScript(node.value)
  if (node.kind === 'unary') return `(-${expressionToJavaScript(node.operand)})`
  return `(${expressionToJavaScript(node.left)} ${node.operator} ${expressionToJavaScript(node.right)})`
}

export const createJavaScriptRunner = (
  node: ExpressionNode
): BenchmarkRunner => {
  const expression = expressionToJavaScript(node)
  // 入力文字列は直接渡さず、検証済み AST から数値と四則演算だけを再生成する。
  // これにより式をループへ直書きでき、Wasm と同じ計算粒度で比較できる。
  const createRunner = new Function(
    `"use strict"; return (iterations) => {
      let checksum = 0;
      for (let index = 0; index < iterations; index += 1) {
        checksum += ${expression};
      }
      return checksum;
    }`
  ) as () => BenchmarkRunner

  return createRunner()
}
