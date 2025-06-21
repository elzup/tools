import { BinaryPacketData } from '../../types/binaryPacketData'

export type Transformer = (input: string) => TransformResult

export type TransformResult = {
  success: boolean
  diagram?: string
  error?: string
}
