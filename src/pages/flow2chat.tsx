import React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'flow editor for chatbot'

function Component() {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
    </Layout>
  )
}
export default Component
