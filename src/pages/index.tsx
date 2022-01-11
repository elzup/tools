import { Typography } from '@mui/material'
import { NextPage } from 'next'
import * as React from 'react'
import { Icon } from 'semantic-ui-react'
import Layout from '../components/Layout'

const IndexPage: NextPage = () => {
  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <Typography variant="h1" style={{ marginTop: '40px' }}>
        <Icon name="microchip" circular />
        TODO: Tools
        <p>made by anozon</p>
      </Typography>
      <Typography variant="h3">Collection of Minimum web tools</Typography>
    </Layout>
  )
}

export default IndexPage
