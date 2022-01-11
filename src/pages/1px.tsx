import React, { useEffect, useState } from 'react'
import { RGBColor, SketchPicker } from 'react-color'
import { Image, TextArea } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

function gen1pxDataUrl(rgb: RGBColor) {
  const size = 1
  const canvasElem = document.createElement('canvas')

  canvasElem.width = size
  canvasElem.height = size
  const ctx = canvasElem.getContext('2d')

  if (!ctx) return ''

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a || 0})`
  ctx.fillRect(0, 0, size, size)

  return canvasElem.toDataURL()
}

const checkerUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg=='

const title = '1px data url generator'
const defaultPresetColors = [
  '#D0021B',
  '#F5A623',
  '#F8E71C',
  '#8B572A',
  '#7ED321',
  '#417505',
  '#BD10E0',
  '#9013FE',
  '#4A90E2',
  '#50E3C2',
  '#B8E986',
  '#000000',
  '#4A4A4A',
  '#9B9B9B',
  '#FFFFFF',
]
const NoOpener = () => {
  const [hex, setHex] = useState<RGBColor>({ r: 0, g: 0, b: 0, a: 1 })
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    setUrl(gen1pxDataUrl(hex))
  }, [hex])

  const imgUrl = `<img src="${url}" />`

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <div style={{ display: 'grid' }}>
        <SketchPicker
          presetColors={[...defaultPresetColors, 'rgba(0, 0, 0, 0)']}
          color={hex}
          onChange={(e) => setHex(e.rgb)}
        />
        <div
          style={{
            padding: '8px',
            backgroundImage: `url(${checkerUrl})`,
            width: 'fit-content',
          }}
        >
          <Image src={url} size="tiny" bordered />
        </div>
        <TextArea value={url} style={{ background: '#eee', width: '100%' }} />
        <TextArea
          value={imgUrl}
          style={{ background: '#eee', width: '100%' }}
        />
      </div>
    </Layout>
  )
}

export default NoOpener
