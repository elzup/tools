import styled from 'styled-components'

type Props = {
  text: string | number
  variant?: 'basic' | 'plain'
}
const CodeLabel = ({ text, variant = 'basic' }: Props) => {
  return <Style data-variant={variant}>{text}</Style>
}

const Style = styled.span`
  white-space: pre;
  font-family: monospace;
  &[data-variant='basic'] {
    background: #ddd;
  }
  &[data-variant='plain'] {
  }
`

export default CodeLabel
