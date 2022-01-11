import dynamic from 'next/dynamic'
import React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const SubWindowParts = dynamic(() => import('../components/SubWindowParts'), {
  ssr: false,
})

const title = 'sub Window experiment'
const SubWindowEx = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <SubWindowParts />
    </Layout>
  )
}

export default SubWindowEx
