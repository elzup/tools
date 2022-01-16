import * as React from 'react'
import Layout from '../components/Layout'
import SvgPlay from '../components/SvgPlay'
import { Title } from '../components/Title'

const title = 'SVG Playground'
const SvgPlayPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <SvgPlay />
    </Layout>
  )
}

export default SvgPlayPage
