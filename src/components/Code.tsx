import styled from 'styled-components'
import { WithChild } from '../types'

type Props = {
  format?: 'text' | 'json'
}

const Code = ({ children, format = 'text' }: WithChild<Props>) => {
  const codeText = formatCodeText(String(children ?? ''), format)

  return (
    <Style>
      <code>{codeText}</code>
    </Style>
  )
}

const formatCodeText = (text: string, format: Props['format']) => {
  if (format !== 'json') return text

  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

const Style = styled.pre`
  overflow: auto;
  max-width: 100%;
  background: #f4f6f8;
  border: 1px solid #d5dce5;
  border-radius: 6px;
  color: #1f2937;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  padding: 10px 12px;
  white-space: pre;
`

export default Code
