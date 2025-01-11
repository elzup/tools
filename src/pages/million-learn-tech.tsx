import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const MillionLearnTech = dynamic(
  () => import('../components/MillionLearnTech'),
  { ssr: false }
)

const title = 'Million Leaning tech'
const MillionLearnTechPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <MillionLearnTech />
    </Layout>
  )
}

export default MillionLearnTechPage
