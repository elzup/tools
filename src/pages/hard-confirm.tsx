import { Typography } from '@mui/material'
import React from 'react'
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
      <Typography>終了する場合はタブを閉じてください</Typography>
    </Layout>
  )
}

export default HardConfirm
