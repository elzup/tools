import { faUser } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Card, TextField } from '@mui/material'
import * as React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'XSSデモ'
const NoOpener = () => {
  const [name, setName] = React.useState<string>('名前')
  const [preName, setPreName] = React.useState<string>('名前')

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <p>指定された名前を生のHTMLでレンダリングします。</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <TextField
            value={preName}
            style={{ width: '100%' }}
            onChange={(e) => {
              setPreName(e.target.value)
            }}
          />
          <Button
            onClick={() => {
              setName(preName)
            }}
          >
            更新する
          </Button>
        </div>
        <div>
          <Card style={{ width: '200px', padding: '10px' }}>
            <img
              src={`https://avatars.dicebear.com/4.5/api/male/${name}.svg`}
            />
            <div>
              <div dangerouslySetInnerHTML={{ __html: name }}></div>
              <div>
                <span className="date">Joined in 2020</span>
              </div>
              <div>{"I'm Engineer."}</div>
            </div>
            <div>
              <a>
                <FontAwesomeIcon icon={faUser} />
                22 Friends
              </a>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default NoOpener
