import Layout from '../components/Layout'
import QRForm from '../components/QrForm'

const title = 'Logicript プロトタイプ'
const MermaidUi = () => {
  return (
    <Layout title={title}>
      {/* <Title>{title}</Title> */}
      <QRForm />
    </Layout>
  )
}

export default MermaidUi
