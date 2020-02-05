import * as React from 'react'
import { NextPage } from 'next'
import Layout from '../components/Layout'

const IndexPage: NextPage = () => {
  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <h1>Tools made by anozon</h1>
      <p>Collection of Minimum web tools</p>
    </Layout>
  )
}

export default IndexPage
