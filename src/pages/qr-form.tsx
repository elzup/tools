import { Typography } from '@mui/material'
import Layout from '../components/Layout'
import QRForm from '../components/QrForm'
import { Title } from '../components/Title'

const title = 'QRコード生成フォーム'
const MermaidUi = () => {
  return (
    <Layout title={title}>
      {/* <Title>{title}</Title> */}
      <QRForm />
    </Layout>
  )
}

export default MermaidUi
