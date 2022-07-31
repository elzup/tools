import { range } from '@elzup/kit'

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

export const isCmd = (cmd: string): cmd is Cmd => ''.includes(cmd)

export const getFormat = (cmd: string) => {
  if (!isCmd(cmd)) return null
  if (cmdChars1.includes(cmd)) return { cmd, len: 1 }
  if (cmdChars2.includes(cmd)) return { cmd, len: 2 }
  if (cmdChars4.includes(cmd)) return { cmd, len: 4 }
  if (cmdChars8.includes(cmd)) return { cmd, len: 8 }
  return null
}
