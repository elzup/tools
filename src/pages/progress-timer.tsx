import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// localStorage / window / ライブ時計を使うため SSR 無効化 (REQ-U11)
const ProgressTimer = dynamic(() => import('../components/ProgressTimer'), {
  ssr: false,
})

const title = '進行タイマー'

const ProgressTimerPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <ProgressTimer />
    </Layout>
  )
}

export default ProgressTimerPage
