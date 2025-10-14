import { Button, TextField, Typography } from '@mui/material'
import Link from 'next/link'
import * as React from 'react'
import styled from 'styled-components'

import Code from '../components/Code'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { formatHtml } from '../lib/htmlFormatter'
import { getComponentHtmlCode } from '../utils'

const title = 'XSSデモ'
const NoOpener = () => {
  const [name, setName] = React.useState<string>('名前')
  const [preName, setPreName] = React.useState<string>('名前')
  const [html, setHtml] = React.useState<string>('')

  React.useEffect(() => {
    const component = React.createElement(ProfileCard, { name })

    getComponentHtmlCode(component).then((html) => setHtml(formatHtml(html)))
  }, [name])

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Typography>指定された名前を生のHTMLでレンダリングします。</Typography>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <TextField
          value={preName}
          onChange={(e) => setPreName(e.target.value)}
        />
        <Button onClick={() => setName(preName)}>更新する</Button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          gap: '1rem',
        }}
      >
        <div>
          <ProfileCard name={name} />
        </div>
        <div>
          <Code>{html}</Code>
        </div>
      </div>
    </Layout>
  )
}

function ProfileCard({ name }: { name: string }) {
  return (
    <Card>
      <img src={`https://avatars.dicebear.com/4.5/api/male/${name}.svg`} />
      <div>
        <div dangerouslySetInnerHTML={{ __html: name }}></div>
        <div>
          <span className="date">Joined in 2020</span>
        </div>
        <div>{"I'm Engineer."}</div>
      </div>
      <div>
        <Link href="./">22 Follower</Link>
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
