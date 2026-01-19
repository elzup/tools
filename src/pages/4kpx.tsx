import { faCopy, faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import dynamic from 'next/dynamic'
import React, { useState } from 'react'
import { RGBColor, SketchPicker } from 'react-color'
import styled from 'styled-components'
import { defaultPresetColors } from '../components/constants/color'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = '4K Pattern SVG Generator'

type Position = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

function rgbToString(rgb: RGBColor): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a ?? 1})`
}

function gen4kPatternSvg(colors: Record<Position, RGBColor>): string {
  const width = 3840
  const height = 2160

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <pattern id="p" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="1" fill="${rgbToString(colors.topLeft)}"/>
      <rect x="1" y="0" width="1" height="1" fill="${rgbToString(colors.topRight)}"/>
      <rect x="0" y="1" width="1" height="1" fill="${rgbToString(colors.bottomLeft)}"/>
      <rect x="1" y="1" width="1" height="1" fill="${rgbToString(colors.bottomRight)}"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#p)"/>
</svg>`
}

const checkerUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg=='

type ColorPickerProps = {
  label: string
  color: RGBColor
  onChange: (color: RGBColor) => void
}

const ColorPickerSection = ({ label, color, onChange }: ColorPickerProps) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box
        sx={{
          display: 'inline-block',
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
        }}
      >
        <SketchPicker
          presetColors={[...defaultPresetColors, 'rgba(0, 0, 0, 0)']}
          color={color}
          onChange={(e) => onChange(e.rgb)}
          width="200px"
        />
      </Box>
    </Box>
  )
}

const Px4kContent = () => {
  const [colors, setColors] = useState<Record<Position, RGBColor>>({
    topLeft: { r: 255, g: 0, b: 0, a: 1 },
    topRight: { r: 0, g: 255, b: 0, a: 1 },
    bottomLeft: { r: 0, g: 0, b: 255, a: 1 },
    bottomRight: { r: 255, g: 255, b: 0, a: 1 },
  })

  const setColor = (pos: Position, color: RGBColor) => {
    setColors((prev) => ({ ...prev, [pos]: color }))
  }

  const svgCode = gen4kPatternSvg(colors)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const handleDownload = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '4k-pattern.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Style>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              2x2 Pattern Colors
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Configure the 4 colors for the 2x2 pattern that will repeat across
              4K resolution (3840x2160)
            </Typography>

            <Grid container spacing={2}>
              <Grid size={6}>
                <ColorPickerSection
                  label="Top Left"
                  color={colors.topLeft}
                  onChange={(c) => setColor('topLeft', c)}
                />
              </Grid>
              <Grid size={6}>
                <ColorPickerSection
                  label="Top Right"
                  color={colors.topRight}
                  onChange={(c) => setColor('topRight', c)}
                />
              </Grid>
              <Grid size={6}>
                <ColorPickerSection
                  label="Bottom Left"
                  color={colors.bottomLeft}
                  onChange={(c) => setColor('bottomLeft', c)}
                />
              </Grid>
              <Grid size={6}>
                <ColorPickerSection
                  label="Bottom Right"
                  color={colors.bottomRight}
                  onChange={(c) => setColor('bottomRight', c)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Preview & Export
            </Typography>

            <Box className="preview-container" sx={{ mb: 2 }}>
              <Box className="preview-pattern">
                <Box
                  dangerouslySetInnerHTML={{
                    __html: svgCode
                      .replace(/width="3840"/g, 'width="200"')
                      .replace(/height="2160"/g, 'height="112.5"'),
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                2x2 Pattern (enlarged)
              </Typography>
              <Box className="preview-container">
                <svg width="80" height="80" style={{ display: 'block' }}>
                  <rect
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    fill={rgbToString(colors.topLeft)}
                  />
                  <rect
                    x="40"
                    y="0"
                    width="40"
                    height="40"
                    fill={rgbToString(colors.topRight)}
                  />
                  <rect
                    x="0"
                    y="40"
                    width="40"
                    height="40"
                    fill={rgbToString(colors.bottomLeft)}
                  />
                  <rect
                    x="40"
                    y="40"
                    width="40"
                    height="40"
                    fill={rgbToString(colors.bottomRight)}
                  />
                </svg>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                SVG Code
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  multiline
                  fullWidth
                  value={svgCode}
                  size="small"
                  rows={6}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
                <IconButton
                  onClick={() => handleCopy(svgCode)}
                  size="small"
                  color="primary"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </IconButton>
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<FontAwesomeIcon icon={faDownload} />}
              onClick={handleDownload}
              fullWidth
            >
              Download SVG (3840x2160)
            </Button>

            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: 'block', mt: 1 }}
            >
              File size: ~{Math.ceil(svgCode.length / 1024)} KB
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Style>
  )
}

const Style = styled.div`
  .preview-container {
    padding: 8px;
    background-image: url('${checkerUrl}');
    width: fit-content;
    border-radius: 4px;
  }

  .preview-pattern {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
    background: white;
  }
`

const Px4kContentDynamic = dynamic(() => Promise.resolve(Px4kContent), {
  ssr: false,
})

const Px4k = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Box mt={2}>
        <Px4kContentDynamic />
      </Box>
    </Layout>
  )
}

export default Px4k
