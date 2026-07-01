import { MenuItem, TextField } from '@mui/material'
import { useState } from 'react'
import { FaClipboard, FaFileImport } from 'react-icons/fa'
import styled from 'styled-components'

type PasteMode = 'auto' | 'text' | 'hex' | 'base64'

type Props = {
  // 取り込んだ生バイト列を hex 文字列で受け取る
  onData: (hex: string) => void
}

const bytesToHex = (ab: ArrayBuffer) => Buffer.from(ab).toString('hex')
const pickHexChar = (s: string) => s.replace(/[^0-9a-f]/gi, '')
const pickBase64Char = (s: string) => s.replace(/[^A-Za-z0-9+/=_-]/gi, '')

const looksHex = (s: string) => {
  const t = s.replace(/\s/g, '')

  return t.length > 0 && t.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(t)
}
const looksBase64 = (s: string) => {
  const t = s.trim()

  return t.length > 0 && t.length % 4 === 0 && /^[A-Za-z0-9+/=_-]+$/.test(t)
}

const textToHex = (raw: string, mode: PasteMode): string => {
  if (mode === 'hex') return pickHexChar(raw)
  if (mode === 'base64')
    return Buffer.from(pickBase64Char(raw), 'base64').toString('hex')
  if (mode === 'text') return Buffer.from(raw).toString('hex')

  // auto
  if (looksHex(raw)) return pickHexChar(raw)
  if (looksBase64(raw))
    return Buffer.from(pickBase64Char(raw), 'base64').toString('hex')
  return Buffer.from(raw).toString('hex')
}

export const PasteZone = ({ onData }: Props) => {
  const [mode, setMode] = useState<PasteMode>('auto')
  const [dragging, setDragging] = useState(false)
  const [note, setNote] = useState('')

  const importBlob = async (blob: Blob, label: string) => {
    onData(bytesToHex(await blob.arrayBuffer()))
    setNote(`imported ${blob.size} bytes (${label})`)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const dt = e.clipboardData
    // バイナリ(ファイル)を優先。フォームの text 変換を通さず生バイトで取り込む
    const items = Array.from(dt.items)
    const fileItem = items.find((it) => it.kind === 'file')
    const file = fileItem?.getAsFile()
    const rawText = dt.getData('text/plain')

    e.preventDefault()

    if (file) {
      await importBlob(file, file.type || 'binary')
      return
    }
    onData(textToHex(rawText, mode))
    setNote(`imported text (${mode})`)
  }

  const handleClickPaste = async () => {
    try {
      const items = await navigator.clipboard.read()

      for (const item of items) {
        const binType = item.types.find(
          (t) => t !== 'text/plain' && t !== 'text/html'
        )

        if (binType) {
          await importBlob(await item.getType(binType), binType)
          return
        }
      }
      const text = await navigator.clipboard.readText()

      onData(textToHex(text, mode))
      setNote(`imported text (${mode})`)
    } catch {
      const text = await navigator.clipboard.readText().catch(() => '')

      if (text) {
        onData(textToHex(text, mode))
        setNote(`imported text (${mode})`)
      } else {
        setNote('clipboard read denied — try pasting into the box')
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]

    if (file) await importBlob(file, file.type || 'file')
  }

  return (
    <Style
      data-dragging={dragging ? 'on' : 'off'}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      tabIndex={0}
    >
      <div className="row">
        <FaClipboard className="icon" />
        <div className="msg">
          <strong>ここに貼り付け</strong> (Ctrl/⌘+V) ・ ファイルを D&amp;D
          <div className="sub">
            フォーム変換を通さず生バイトとして取り込みます
          </div>
        </div>
        <TextField
          select
          size="small"
          label="text as"
          value={mode}
          onChange={(e) => setMode(e.target.value as PasteMode)}
          onClick={(e) => e.stopPropagation()}
          sx={{ minWidth: 110 }}
        >
          <MenuItem value="auto">Auto</MenuItem>
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="hex">Hex</MenuItem>
          <MenuItem value="base64">Base64</MenuItem>
        </TextField>
        <button type="button" className="paste-btn" onClick={handleClickPaste}>
          <FaFileImport size={12} /> Paste
        </button>
      </div>
      {note && <div className="note">{note}</div>}
    </Style>
  )
}

const Style = styled.div`
  border: 1.5px dashed #cbb;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  background: #fbf9f7;
  cursor: text;
  transition:
    border-color 0.12s ease,
    background 0.12s ease;
  outline: none;

  &:focus,
  &[data-dragging='on'] {
    border-color: #d4a017;
    background: #fffbeb;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .icon {
    color: #a1887f;
    flex-shrink: 0;
  }
  .msg {
    flex: 1;
    font-size: 0.85rem;
    color: #5d4037;
    .sub {
      font-size: 0.72rem;
      color: #9e9e9e;
    }
  }
  .paste-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid #d7ccc8;
    background: #fff;
    color: #795548;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.78rem;
    cursor: pointer;
    &:hover {
      background: #efebe9;
    }
  }
  .note {
    margin-top: 6px;
    font-size: 0.72rem;
    color: #2e7d32;
  }
`
