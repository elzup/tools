import React, { useState } from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import Nixie from '../components/DivergenceMeter/Nixie'

const title = 'DivergenceMeter'
const DivergenceMeter = () => {
  const [text, setText] = useState<string>('')

  React.useEffect(() => {}, [])

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <input onChange={({ target: { value } }) => setText(value)}></input>
      {text.split('').map((n, i) => (
        <Nixie key={`nk-${i}`} active={n} />
      ))}
    </Layout>
  )
}

export default DivergenceMeter
