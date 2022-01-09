import React, { useState } from 'react'
import { Header } from 'semantic-ui-react'
import DivergenceMeterComp from '../components/DivergenceMeter'
import Layout from '../components/Layout'

const title = 'DivergenceMeter'
const DivergenceMeter = () => {
  const [text, setText] = useState<string>('0.123456789')

  React.useEffect(() => {}, [])

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <input
        // pattern="[0-9.]{0,12}"
        defaultValue={text}
        onChange={({ target: { value } }) => setText(value)}
      ></input>
      <DivergenceMeterComp chars={text}></DivergenceMeterComp>
    </Layout>
  )
}

export default DivergenceMeter
