import Layout from '../components/Layout'
import SlilPrototype from '../components/SlilPrototype'

const title = 'slil'

const SlilPage = () => {
  return (
    <Layout title={title} fullWidth footer="minimal">
      <SlilPrototype />
    </Layout>
  )
}

export default SlilPage
