import React, { useEffect, useState } from 'react'
import { SketchPicker } from 'react-color'

import {
  Button,
  Card,
  Form,
  Grid,
  Header,
  Icon,
  Image,
  Input,
  TextArea,
} from 'semantic-ui-react'
import Layout from '../components/Layout'

function gen1pxDataUrl(hex: string) {
  const size = 1
  const canvasElem = document.createElement('canvas')

  canvasElem.width = size
  canvasElem.height = size
  const ctx = canvasElem.getContext('2d')

  if (!ctx) return ''

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = hex
  ctx.fillRect(0, 0, size, size)

  return canvasElem.toDataURL()
}
const title = '1px data url generator'
const NoOpener = () => {
  const [hex, setHex] = useState<string>('')
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    setUrl(gen1pxDataUrl(hex))
  }, [hex])

  const imgUrl = `<img src="${url}" />`

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>

      <div style={{ display: 'grid', gap: '8px' }}>
        <SketchPicker color={hex} onChange={(e) => setHex(e.hex)} />
        <Image src={url} size="tiny" bordered />
        <TextArea value={url} style={{ background: '#eee' }} />
        <TextArea value={imgUrl} style={{ background: '#eee' }} />
      </div>
    </Layout>
  )
}

export default NoOpener
