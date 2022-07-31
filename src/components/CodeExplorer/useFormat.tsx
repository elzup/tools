import { useMemo, useState } from 'react'
import { Cmd, getFormat } from './utils'

export const useFormat = (buf: Buffer) => {
  const [format, setFormat] = useState<string>('')

  const parsed = useMemo(() => {
    const bufs: { cmd: Cmd; bufs: Buffer }[] = []
    let p = 0

    format.split('').forEach((cmd) => {
      const f = getFormat(cmd)

      if (f === null) return

      bufs.push({ cmd, bufs: buf.subarray(p, p + f.len) })
      p = p + f.len
    })
    return bufs
  }, [buf, format])

  return { format, setFormat, parsed }
}
