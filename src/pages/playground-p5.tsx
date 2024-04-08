import dynamic from 'next/dynamic'
import Layout from '../components/Layout'

const title = 'playground p5'

const PlaygroundP5 = dynamic(() => import('../components/PlaygroundP5'), {
  ssr: false,
})

const Playground = () => {
  return (
    <Layout title={title} fullWidth>
      <PlaygroundP5 />
    </Layout>
  )
}

export default Playground
