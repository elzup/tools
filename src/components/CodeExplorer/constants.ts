// UTF-8 のリードバイト種別 (先頭ビットの意味) を色と説明で一元管理する。
// data-utf8cate = bitStr(c).indexOf('0') に対応:
//   0: 0xxxxxxx     ASCII (1byte)
//   1: 10xxxxxx     継続バイト (continuation)
//   2: 110xxxxx     2byte 先頭
//   3: 1110xxxx     3byte 先頭
//   4: 11110xxx     4byte 先頭
export type Utf8Cate = 0 | 1 | 2 | 3 | 4

export const utf8CateInfo: Record<
  Utf8Cate,
  { color: string; label: string; pattern: string }
> = {
  0: { color: '#78909c', label: 'ASCII', pattern: '0xxxxxxx' },
  1: { color: '#26a69a', label: 'continuation', pattern: '10xxxxxx' },
  2: { color: '#5c6bc0', label: '2-byte lead', pattern: '110xxxxx' },
  3: { color: '#8e24aa', label: '3-byte lead', pattern: '1110xxxx' },
  4: { color: '#ef6c00', label: '4-byte lead', pattern: '11110xxx' },
}

export const utf8Cates: Utf8Cate[] = [0, 1, 2, 3, 4]

export type Endian = 'LE' | 'BE'

// Packet View の初期入力例 (uint8 + uint16 + uint32 + float = 11byte)
export const DEFAULT_STRUCT_FORMAT = 'BHIf'

// struct format 文字 → 型の対応 (よく使うものだけ抜粋)
export const structCheat: { cmd: string; type: string }[] = [
  { cmd: 'b', type: 'int8' },
  { cmd: 'B', type: 'uint8' },
  { cmd: 'h', type: 'int16' },
  { cmd: 'H', type: 'uint16' },
  { cmd: 'i', type: 'int32' },
  { cmd: 'I', type: 'uint32' },
  { cmd: 'q', type: 'int64' },
  { cmd: 'Q', type: 'uint64' },
  { cmd: 'f', type: 'float' },
  { cmd: 'd', type: 'double' },
]
