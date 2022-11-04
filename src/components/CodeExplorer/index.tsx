import { makeToggle } from '@elzup/kit'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { ComponentProps, useState } from 'react'
import { FaArrowsAltH } from 'react-icons/fa'
import styled from 'styled-components'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { ByteBlock } from './ByteBlock'
import CodeLabel from './CodeLabel'
import { TypeBlock } from './TypeBlock'
import { useFormat } from './useFormat'
import { Utf8Block } from './Utf8Block'
import { readableAscii, uints } from './utils'

const layoutState = ['col8', 'col4', 'fill'] as const
const pickHexChar = (s: string) => s.replace(/[^0-9a-f]/gi, '')
const pickBase64Char = (s: string) => s.replace(/[^A-Za-z0-9+/=_-]/gi, '')
const base64ToHex = (s: string) => Buffer.from(s, 'base64').toString('hex')
const utf8ToHex = (s: string) => Buffer.from(s).toString('hex')
const toggle = makeToggle(['base64', 'base64url'] as const)

type LayoutState = typeof layoutState[number]
const isLayoutState = (v: unknown): v is LayoutState =>
  typeof v === 'string' && layoutState.includes(v as LayoutState)
const base64UnUrl = (s: string) =>
  s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/g, '')

const PanelBox = (props: ComponentProps<typeof Box>) => (
  <Box border={'solid 1px'} mt={1} p={1} borderRadius={1} {...props} />
)

function CodeExplorer() {
  const [hex, setHex] = useLocalStorage<string>('code-explorer-hex', '')
  const [layout, setLayout] = useState<LayoutState>('col8')
  const [baseEncMode, setBaseEncMode] = useState<'base64' | 'base64url'>(
    'base64'
  )
  const buf = Buffer.from(hex, 'hex')
  const { format, setFormat, parsed } = useFormat(buf)

  const text = buf.toString('utf8')
  const base64Base = buf.toString('base64')
  const base64 = baseEncMode === 'base64' ? base64Base : base64UnUrl(base64Base)

  const intNums = uints(buf)

  return (
    <Style>
      <div className="forms">
        <TextField
          value={text}
          label="text"
          multiline
          fullWidth
          style={{ fontSize: '0.8rem' }}
          onChange={(e) => setHex(utf8ToHex(e.currentTarget.value))}
        />
        <TextField
          size="small"
          label="hex"
          value={hex}
          inputProps={{ pattern: '' }}
          fullWidth
          style={{ fontSize: '0.8rem' }}
          onChange={(e) => setHex(pickHexChar(e.currentTarget.value))}
        />
        <Box display="grid" gap="1px" p={0.5} gridTemplateColumns="1fr auto">
          <TextField
            size="small"
            label={baseEncMode}
            value={base64}
            inputProps={{ pattern: '' }}
            fullWidth
            style={{ fontSize: '0.8rem' }}
            onChange={(e) => {
              console.log('hello')
              setHex(base64ToHex(pickBase64Char(e.currentTarget.value)))
            }}
          />

          <label>
            <FormControlLabel
              control={
                <Switch onClick={() => setBaseEncMode(toggle(baseEncMode))} />
              }
              label="url"
              labelPlacement="end"
              checked={baseEncMode === 'base64url'}
            />
          </label>
        </Box>
      </div>
      <PanelBox>
        <Box display="flex" justifyContent={'space-between'}>
          <Typography variant="subtitle1">Byte View</Typography>
          <FormControl>
            <FormLabel>layout</FormLabel>
            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={(_e, value) =>
                setLayout(isLayoutState(value) ? value : 'col8')
              }
              aria-label="blocks alignment"
            >
              <ToggleButton size="small" value="fill" aria-label="fill">
                <FaArrowsAltH />
              </ToggleButton>
              <ToggleButton size="small" value="col8" aria-label="8 column">
                Col8
              </ToggleButton>
              <ToggleButton size="small" value="col4" aria-label="4 column">
                Col4
              </ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
        </Box>
        <div className="blocks" data-layout={layout}>
          {intNums.map((v, i) => (
            <ByteBlock key={i} c={v} />
          ))}
        </div>
      </PanelBox>
      <PanelBox>
        <Typography variant="subtitle1">UTF-8 View</Typography>
        <div className="blocks">
          {[...text].map((s, i) => (
            <Utf8Block key={i} s={s} />
          ))}
        </div>
      </PanelBox>
      <PanelBox>
        <Typography variant="subtitle1">Packet View</Typography>
        <a
          href="https://docs.python.org/ja/3/library/struct.html"
          target="_blank"
          rel="noreferrer"
        >
          Enable: struct format
        </a>
        <Typography variant="caption">Only number</Typography>
        <TextField
          value={format}
          label="format"
          multiline
          fullWidth
          style={{ fontSize: '0.8rem', marginTop: '1rem' }}
          onChange={(e) => setFormat(e.currentTarget.value)}
        />
        <div className="blocks">
          {parsed.map(({ cmd, buf }, i) => (
            <TypeBlock key={i} cmd={cmd} buf={buf} />
          ))}
        </div>
      </PanelBox>
      <PanelBox>
        <Typography variant="subtitle1">hex</Typography>
        <Box className="bytes-line">
          {intNums.map((v, i) => (
            <CodeLabel key={i} text={v.toString(16)} variant="plain" />
          ))}
        </Box>
      </PanelBox>
      <PanelBox>
        <Typography variant="subtitle1">int</Typography>
        <Box className="bytes-line">
          {intNums.map((v, i) => (
            <CodeLabel key={i} text={v} variant="plain" />
          ))}
        </Box>
      </PanelBox>
      <div>
        <Typography variant="caption">{buf.length}Byte</Typography>
        <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
          <Typography variant="caption">ascii</Typography>
          <div>
            <CodeLabel text={buf.toString('ascii')} />
          </div>
          <div>
            <CodeLabel
              text={[...buf.toString('ascii')]
                .map((c) => readableAscii(c.charCodeAt(0)))
                .join('')}
            />
          </div>
        </Box>
        <PanelBox>
          <Typography variant="caption">latin1 (binary)</Typography>
          <div>
            <CodeLabel text={buf.toString('latin1')} />
          </div>
        </PanelBox>
      </div>
    </Style>
  )
}

const Style = styled.div`
  .forms {
    display: grid;
    gap: 1rem;
  }
  .blocks {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    &[data-layout='col8'] {
      display: grid;
      grid-template-columns: repeat(8, max-content);
    }
    &[data-layout='col4'] {
      display: grid;
      grid-template-columns: repeat(4, max-content);
    }

    &[data-layout='fill'] {
      /* display: flex; */
      /* flex-wrap: wrap; */
    }
  }

  .bytes-line {
    span {
      margin: 2px;
    }
    span:nth-child(2n) {
      background: #f0f0f0;
    }
    span:nth-child(8n + 1):not(:first-child) {
      border-left: dashed 1px gray;
    }
  }
`

export default CodeExplorer
