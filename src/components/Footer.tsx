import { Container } from '@mui/material'
import * as React from 'react'
import Menu from './Menu'

type Props = {
  currentPath: string
}
const Footer = ({ currentPath }: Props) => (
  <footer>
    <Container>
      <hr />
      <Menu currentPath={currentPath} />
      <a href="https://anozon.me">anozon.me</a>
    </Container>
  </footer>
)

export default Footer
