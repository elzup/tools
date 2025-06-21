import { BinaryPacketData } from '../../types/binaryPacketData'
import { Transformer, TransformResult } from './transformer'

/**
 * バイナリパケットを図にする変換器
 */
const parseInput = (
  input: string
): { name: string; offset: number; type: string; length: number }[] => {
  const entries = input.split(' ')

  return entries.map((entry) => {
    const [name, offsetStr, type, lengthStr] = entry.split(':')
    const offset = parseInt(offsetStr)
    const length = parseInt(lengthStr)

    return { name, offset, type, length }
  })
}

const generateDiagram = (
  data: { name: string; offset: number; type: string; length: number }[]
): string => {
  const width = (length: number) => length / 2 // 1byte = 2char
  const pad = (str: string, len: number) => str.padEnd(len)

  const line1 = data.map((item) => pad(item.offset.toString(), 5)).join('')
  const line2 = data
    .map((item) => `+${'-'.repeat(width(item.length) * 2 + 3)}+`)
    .join('')
  const line3 = data
    .map((item) => `| ${pad(item.name, width(item.length) * 2)} |`)
    .join('')
  const descriptions = data
    .map((item) => `${item.name}: ${item.name} ${item.length / 8}byte`)
    .join('\n')

  return `${line1}\n${line2}\n${line3}\n${line2}\n${descriptions}`
}

export const generateTextDiagramTransformer: Transformer = (
  input: string
): TransformResult => {
  try {
    const parsedData = parseInput(input)
    const diagram = generateDiagram(parsedData)

    return { success: true, diagram }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)

    return { success: false, error: errorMessage }
  }
}
