import * as React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

const W = 1280
const H = 720

const Ground = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      stroke={'#000'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H6M12 5l-7 7 7 7" />
    </svg>
  )
}

const title = 'SVG Playground'
const SvgPlay = () => {
  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <Ground />
    </Layout>
  )
}

export default SvgPlay
