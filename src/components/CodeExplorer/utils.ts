import { range } from '@elzup/kit/lib/range'
import { controlCharLib } from '@elzup/kit/lib/char/ascii'
import type { Endian } from './constants'

export const uints = (b: Buffer) =>
  range(b.byteLength).map((i) => b.readUint8(i))

const cmdChars1 = 'xcbB?'
const cmdChars2 = 'hHe'
const cmdChars4 = 'iIlLf'
const cmdChars8 = 'qQd'

export const cmdChars = `${cmdChars1}${cmdChars2}${cmdChars4}${cmdChars8}`

// not supported: n N s p P

export type Cmd = (typeof cmdChars)[number]

export const isCmd = (cmd: string): cmd is Cmd => cmdChars.includes(cmd)

export const getFormat = (cmd: string) => {
  if (!isCmd(cmd)) return null
  if (cmdChars1.includes(cmd)) return { cmd, len: 1 }
  if (cmdChars2.includes(cmd)) return { cmd, len: 2 }
  if (cmdChars4.includes(cmd)) return { cmd, len: 4 }
  if (cmdChars8.includes(cmd)) return { cmd, len: 8 }
  return null
}

export const bitStr = (n: number) => n.toString(2).padStart(8, '0')
export const readableAscii = (c: number) => {
  const controlChar = controlCharLib[c]

  if (controlChar) return `[${controlChar.char}]`
  return String.fromCharCode(c)
}

export const transCmdUnsafe = (
  cmd: Cmd,
  buf: Buffer,
  endian: Endian = 'LE'
) => {
  const le = endian === 'LE'

  if (cmd === 'c') return buf.readInt8()
  if (cmd === 'b') return buf.readInt8()
  if (cmd === 'B') return buf.readUint8()
  if (cmd === 'h') return le ? buf.readInt16LE() : buf.readInt16BE()
  if (cmd === 'H') return le ? buf.readUInt16LE() : buf.readUInt16BE()
  if (cmd === 'i' || cmd === 'l')
    return le ? buf.readInt32LE() : buf.readInt32BE()
  if (cmd === 'I' || cmd === 'L')
    return le ? buf.readUInt32LE() : buf.readUInt32BE()
  if (cmd === 'q') return le ? buf.readBigInt64LE() : buf.readBigInt64BE()
  if (cmd === 'Q') return le ? buf.readBigUInt64LE() : buf.readBigUInt64BE()
  // if (cmd === 'e') return buf.read
  if (cmd === 'f') return le ? buf.readFloatLE() : buf.readFloatBE()
  if (cmd === 'd') return le ? buf.readDoubleLE() : buf.readDoubleBE()
  return ''
}

export const transCmd = (cmd: Cmd, buf: Buffer, endian: Endian = 'LE') => {
  try {
    return transCmdUnsafe(cmd, buf, endian)
  } catch {
    return ''
  }
}
