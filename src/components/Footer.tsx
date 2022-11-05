import { Container } from '@mui/material'
import Link from 'next/link'
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
      <Link href="https://anozon.me">anozon.me</Link>
    </Container>
  </footer>
)

export default Footer
