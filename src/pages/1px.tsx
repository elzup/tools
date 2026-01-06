import { faCopy } from '@fortawesome/free-regular-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Grid, IconButton, Paper, TextField, Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import React, { useState } from 'react'
import { RGBColor, SketchPicker } from 'react-color'
import styled from 'styled-components'
import { Box } from '../components/common/mui'
import { defaultPresetColors } from '../components/constants/color'
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
  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a ?? 0})`
  ctx.fillRect(0, 0, size, size)

  return canvasElem.toDataURL()
}

function gen1pxSvgCode(colorStr: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" style="background: ${colorStr}"></svg>`
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

type CopyFieldProps = {
  label: string
  value: string
}

const CopyField = ({ label, value }: CopyFieldProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Box sx={{ position: 'relative', mb: 1 }}>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <TextField
          multiline
          fullWidth
          value={value}
          size="small"
          slotProps={{ input: { readOnly: true } }}
        />
        <IconButton
          onClick={handleCopy}
          size="small"
          color={copied ? 'success' : 'default'}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </IconButton>
      </Box>
    </Box>
  )
}

const Px1Content = () => {
  const [hex, setHex] = useState<RGBColor>({ r: 0, g: 0, b: 0, a: 1 })

  const colorStr = `rgba(${hex.r}, ${hex.g}, ${hex.b}, ${hex.a})`
  const url = gen1pxDataUrl(hex)
  const imgUrl = `<img src="${url}" />`
  const svgCode = gen1pxSvgCode(colorStr)
  const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`

  return (
    <Style>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box className="picker-wrapper">
            <SketchPicker
              presetColors={[...defaultPresetColors, 'rgba(0, 0, 0, 0)']}
              color={hex}
              onChange={(e) => setHex(e.rgb)}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              PNG
            </Typography>
            <Box className="preview-container">
              <img className="preview-img" src={url} alt="1px preview" />
            </Box>
            <CopyField label="Data URL" value={url} />
            <CopyField label="img タグ" value={imgUrl} />
          </Paper>

          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              SVG
            </Typography>
            <Box className="preview-container">
              <Box
                className="preview-svg"
                dangerouslySetInnerHTML={{
                  __html: svgCode.replace(/"1"/g, '"40"'),
                }}
              />
            </Box>
            <Box className="preview-container" sx={{ mb: 2 }}>
              <img className="preview-img" src={svgUrl} alt="svg preview" />
            </Box>
            <CopyField label="Data URL" value={svgUrl} />
            <CopyField label="svg タグ" value={svgCode} />
          </Paper>
        </Grid>
      </Grid>
    </Style>
  )
}

const Style = styled.div`
  .picker-wrapper {
    position: sticky;
    top: 80px;
  }

  .preview-container {
    padding: 8px;
    background-image: url('${checkerUrl}');
    width: fit-content;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .preview-img {
    width: 40px;
    height: 40px;
    display: block;
  }

  .preview-svg {
    width: 40px;
    height: 40px;

    svg {
      width: 100%;
      height: 100%;
    }
  }
`

const Px1ContentDynamic = dynamic(() => Promise.resolve(Px1Content), {
  ssr: false,
})

const Px1 = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Box mt={2}>
        <Px1ContentDynamic />
      </Box>
    </Layout>
  )
}

export default Px1
