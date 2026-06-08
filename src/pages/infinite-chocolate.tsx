import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const ChocolatePuzzle = dynamic(() => import('../components/ChocolatePuzzle'), {
  ssr: false,
})

const title = '無限チョコレートパズル'

const InfiniteChocolatePage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <ChocolatePuzzle />
    </Layout>
  )
}

export default InfiniteChocolatePage
