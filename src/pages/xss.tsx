import { Button, TextField } from '@mui/material'
import * as React from 'react'
import styled from 'styled-components'
import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { getComponentHtmlCode } from '../utils'

const title = 'XSSデモ'
const NoOpener = () => {
  const [name, setName] = React.useState<string>('名前')
  const [preName, setPreName] = React.useState<string>('名前')
  const [html, setHtml] = React.useState<string>('')

  React.useEffect(() => {
    const component = React.createElement(ProfileCard, { name })

    getComponentHtmlCode(component).then((html) =>
      setHtml(prettier.format(html, { plugins: [parserHtml], parser: 'html' }))
    )
  }, [name])

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <p>指定された名前を生のHTMLでレンダリングします。</p>
      <div>
        <TextField
          value={preName}
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
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
      >
        <div>
          <ProfileCard name={name} />
        </div>
        <div>
          <code>
            <pre>{html}</pre>
          </code>
        </div>
      </div>
    </Layout>
  )
}

function ProfileCard({ name }: { name: string }) {
  return (
    <Card style={{}}>
      <img src={`https://avatars.dicebear.com/4.5/api/male/${name}.svg`} />
      <div>
        <div dangerouslySetInnerHTML={{ __html: name }}></div>
        <div>
          <span className="date">Joined in 2020</span>
        </div>
        <div>{"I'm Engineer."}</div>
      </div>
      <div>
        <a>22 Follower</a>
      </div>
    </Card>
  )
}
const Card = styled.div`
  width: 200px;
  padding: 10px;
  border: solid #ddd 1px;
  border-radius: 4px;
  margin-top: 8px;
`

export default NoOpener
