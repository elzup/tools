import styled from 'styled-components'

type Props = {
  text: string | number
  variant?: 'basic'
}
const Code = ({ text, variant = 'basic' }: Props) => {
  return <Style data-variant={variant}>{text}</Style>
}

const Style = styled.div`
  [data-variant='basic'] {
  }
`

export default Code
