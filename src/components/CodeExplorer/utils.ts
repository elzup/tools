import { range } from '@elzup/kit/lib/range'
import { controlCharLib } from '@elzup/kit/lib/ascii'

export const uints = (b: Buffer) => [
  ...range(b.byteLength).map((i) => {
    return b.readUint8(i)
  }),
]

const cmdChars1 = 'xcbB?'
const cmdChars2 = 'hHe'
const cmdChars4 = 'iIlLf'
const cmdChars8 = 'qQd'

export const cmdChars = `${cmdChars1}${cmdChars2}${cmdChars4}${cmdChars8}`

// not supported: n N s p P

export type Cmd = typeof cmdChars[number]

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

export const transCmdUnsafe = (cmd: Cmd, buf: Buffer) => {
  // const buf = buffer.Buffer.from(b)

  if (cmd === 'c') return buf.readInt8()
  if (cmd === 'b') return buf.readInt8()
  if (cmd === 'B') return buf.readUint8()
  if (cmd === 'h') return buf.readInt16LE()
  if (cmd === 'H') return buf.readUInt16LE()
  if (cmd === 'i' || cmd === 'l') return buf.readInt32LE()
  if (cmd === 'I' || cmd === 'L') return buf.readUInt32LE()
  if (cmd === 'q') return buf.readBigInt64LE()
  if (cmd === 'Q') return buf.readBigUInt64LE()
  // if (cmd === 'e') return buf.read
  if (cmd === 'f') return buf.readFloatLE()
  if (cmd === 'd') return buf.readDoubleLE()
  return ''
}

export const transCmd = (cmd: Cmd, buf: Buffer) => {
  try {
    return transCmdUnsafe(cmd, buf)
  } catch (_e) {
    return ''
  }
}
