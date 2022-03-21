import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Typography } from '@mui/material'
import { NextPage } from 'next'
import * as React from 'react'
import Layout from '../components/Layout'

const IndexPage: NextPage = () => {
  return (
    <Layout title="Home | Next.js + TypeScript Example" top>
      <Box sx={{ textAlign: 'center', m: 3 }}>
        <Typography variant="h1">
          <div>
            <FontAwesomeIcon size="2x" icon={faSatellite} />
          </div>
          anozon/tools
        </Typography>
        <Typography variant="subtitle1">
          Collection of Minimum web tools
        </Typography>
      </Box>
    </Layout>
  )
}

export default IndexPage
