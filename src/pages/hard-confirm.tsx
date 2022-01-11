import React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'Submit'
const HardConfirm = () => {
  const handleClick = (actionName: string) => {
    const confirmed = confirm(actionName + 'しますか？')

    handleClick(`「${actionName}」を${confirmed ? '実行' : 'キャンセル'}`)
  }

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <button onClick={() => handleClick('送信')}>送信</button>
    </Layout>
  )
}

export default HardConfirm
