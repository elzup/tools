import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// 乱数で候補者を生成するので、SSR とクライアントで値がずれないよう無効化する
const SecretaryProblem = dynamic(
  () => import('../components/SecretaryProblem'),
  { ssr: false }
)

const title = '秘書問題シミュレーション'

const SecretaryProblemPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <SecretaryProblem />
    </Layout>
  )
}

export default SecretaryProblemPage
