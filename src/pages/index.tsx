import * as React from 'react'
import { NextPage } from 'next'
import { Header, Icon } from 'semantic-ui-react'
import Layout from '../components/Layout'

const IndexPage: NextPage = () => {
  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <Header as="h1" icon textAlign="center" style={{ marginTop: '40px' }}>
        <Icon name="microchip" circular />
        <Header.Content>
          Tools
          <p>made by anozon</p>
        </Header.Content>
      </Header>
      <Header as="h3" icon textAlign="center">
        Collection of Minimum web tools
      </Header>
    </Layout>
  )
}

export default IndexPage
