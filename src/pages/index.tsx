import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Typography } from '@mui/material'
import { NextPage } from 'next'
import * as React from 'react'
import Layout from '../components/Layout'

const IndexPage: NextPage = () => {
  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <Typography variant="h1" style={{ marginTop: '40px' }}>
        <FontAwesomeIcon icon={faSatellite} />
        anozon/tools
      </Typography>
      <Typography variant="h3">Collection of Minimum web tools</Typography>
    </Layout>
  )
}

export default IndexPage
