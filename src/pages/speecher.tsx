import dynamic from 'next/dynamic'
import React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const SpeecherComp = dynamic(() => import('../components/Speecher'), {
  ssr: false,
})

const title = 'lab'
const Speecher = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <SpeecherComp />
    </Layout>
  )
}

export default Speecher
