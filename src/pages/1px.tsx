import { TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { RGBColor, SketchPicker } from 'react-color'
import { defaultPresetColors } from '../components/constants/color'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { getComponentHtmlCode } from '../utils'

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

export const Svg1px = ({ color }: { color: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1"
      height="1"
      style={{ background: color }}
    ></svg>
  )
}

const Px1 = () => {
  const [hex, setHex] = useState<RGBColor>({ r: 0, g: 0, b: 0, a: 1 })
  const [url, setUrl] = useState<string>('')
  const [svgCode, setSvgCode] = useState<string>('')

  const colorStr = `rgba(${hex.r}, ${hex.g}, ${hex.b}, ${hex.a})`

  const component = <Svg1px color={colorStr} />

  useEffect(() => {
    setUrl(gen1pxDataUrl(hex))

    getComponentHtmlCode(component).then((code) => {
      setSvgCode(code)
    })
  }, [hex])

  const imgUrl = `<img src="${url}" />`
  const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <div style={{ display: 'grid' }}>
        <SketchPicker
          presetColors={[...defaultPresetColors, 'rgba(0, 0, 0, 0)']}
          color={hex}
          onChange={(e) => setHex(e.rgb)}
        />
        <Typography variant="h4">png</Typography>
        <div
          style={{
            padding: '8px',
            backgroundImage: `url(${checkerUrl})`,
            width: 'fit-content',
          }}
        >
          <img style={{ width: '40px' }} src={url} />
        </div>
        <TextField
          multiline
          value={url}
          style={{ background: '#eee', width: '100%' }}
        />
        <TextField
          multiline
          value={imgUrl}
          style={{ background: '#eee', width: '100%' }}
        />

        <Typography variant="h4">svg</Typography>
        <div
          style={{
            padding: '8px',
            backgroundImage: `url(${checkerUrl})`,
            width: 'fit-content',
          }}
          dangerouslySetInnerHTML={{ __html: svgCode.replace(/"1"/g, '40') }}
        ></div>
        <div
          style={{
            padding: '8px',
            backgroundImage: `url(${checkerUrl})`,
            width: 'fit-content',
          }}
        >
          <img style={{ width: '40px' }} src={svgUrl} />
        </div>
        <TextField
          multiline
          value={svgUrl}
          style={{ background: '#eee', width: '100%' }}
        />
        <TextField
          multiline
          value={svgCode}
          style={{ background: '#eee', width: '100%' }}
        />
      </div>
    </Layout>
  )
}

export default Px1
