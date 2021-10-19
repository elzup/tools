import * as React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { useGlobalKeyPress } from '../components/useKey'

const title = 'React KeyEvnet hooks'
const KeyEventMaster = () => {
  const [name, setName] = React.useState<string>('名前')
  const [preName, setPreName] = React.useState<string>('名前')

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
    </Layout>
  )
}

export default KeyEventMaster
