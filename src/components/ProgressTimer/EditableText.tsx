import { useEffect, useState } from 'react'
import styled from 'styled-components'

type Props<T> = {
  /** 表示中の確定値 (フォーマット済み文字列) */
  value: string
  /** 入力文字列を T へ。不正なら null を返すと確定をキャンセル */
  parse: (text: string) => T | null
  /** 確定時に呼ぶ */
  onCommit: (parsed: T) => void
  width?: number
  align?: 'left' | 'center' | 'right'
  placeholder?: string
}

/**
 * onBlur / Enter で確定する編集セル。
 * 入力途中 (例 "1:") は draft に保持し、確定時に parse。不正は元値へ戻す。
 */
export function EditableText<T>({
  value,
  parse,
  onCommit,
  width = 56,
  align = 'center',
  placeholder,
}: Props<T>) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)

  // 外部の確定値が変わったら (編集中でなければ) 反映
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const parsed = parse(draft)

    if (parsed === null) {
      setDraft(value)

      return
    }
    onCommit(parsed)
  }

  return (
    <Input
      value={draft}
      placeholder={placeholder}
      style={{ width, textAlign: align }}
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
          e.currentTarget.blur()
        }
      }}
    />
  )
}

const Input = styled.input`
  font: inherit;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 2px 4px;
  background: transparent;
  color: inherit;

  &:hover {
    border-color: #ccc;
  }
  &:focus {
    outline: none;
    border-color: #4080ff;
    background: #fff;
  }
`
