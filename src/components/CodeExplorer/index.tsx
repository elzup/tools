import { makeToggle } from '@elzup/kit/lib/makeToggle'
import {
  FormControlLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { FaArrowsAltH, FaLink } from 'react-icons/fa'
import styled from 'styled-components'
import { writeClipboard } from '../../lib/clipboard'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { Box } from '../common/mui'
import { ByteBlock } from './ByteBlock'
import CodeLabel from './CodeLabel'
import { DEFAULT_STRUCT_FORMAT, type Endian, structCheat } from './constants'
import { CopyButton } from './CopyButton'
import { HoverCell } from './HoverCell'
import { HoverProvider } from './HoverContext'
import { PasteZone } from './PasteZone'
import { TypeBlock } from './TypeBlock'
import { useFormat } from './useFormat'
import { useHexUrlSync } from './useHexUrlSync'
import { Utf8Block } from './Utf8Block'
import { Utf8Legend } from './Utf8Legend'
import { readableAscii, uints } from './utils'

const layoutState = ['col8', 'col4', 'fill'] as const
const pickHexChar = (s: string) => s.replace(/[^0-9a-f]/gi, '')
const pickBase64Char = (s: string) => s.replace(/[^A-Za-z0-9+/=_-]/gi, '')
const base64ToHex = (s: string) => Buffer.from(s, 'base64').toString('hex')
const utf8ToHex = (s: string) => Buffer.from(s).toString('hex')
const toggle = makeToggle(['base64', 'base64url'] as const)

type LayoutState = (typeof layoutState)[number]
const isLayoutState = (v: unknown): v is LayoutState =>
  typeof v === 'string' && layoutState.includes(v as LayoutState)
const base64UnUrl = (s: string) =>
  s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/g, '')

type PanelProps = {
  title: string
  action?: React.ReactNode
  children?: React.ReactNode
}
const Panel = ({ title, action, children }: PanelProps) => (
  <section className="panel">
    <header className="panel-head">
      <Typography variant="subtitle1" className="panel-title">
        {title}
      </Typography>
      {action}
    </header>
    {children}
  </section>
)

function CodeExplorer() {
  const [hex, setHex] = useLocalStorage<string>('code-explorer-hex', '')
  const [layout, setLayout] = useState<LayoutState>('col8')
  const [endian, setEndian] = useState<Endian>('LE')
  const [baseEncMode, setBaseEncMode] = useState<'base64' | 'base64url'>(
    'base64'
  )

  useHexUrlSync(hex, setHex)

  const buf = Buffer.from(hex, 'hex')
  const { format, setFormat, parsed } = useFormat(buf, DEFAULT_STRUCT_FORMAT)

  const text = buf.toString('utf8')
  const base64Base = buf.toString('base64')
  const base64 = baseEncMode === 'base64' ? base64Base : base64UnUrl(base64Base)

  const intNums = uints(buf)
  const hexLine = intNums.map((v) => v.toString(16).padStart(2, '0')).join(' ')
  const intLine = intNums.join(' ')

  const shareUrl = async () => {
    await writeClipboard(window.location.href)
  }

  return (
    <HoverProvider>
      <Style>
        <div className="forms">
          <PasteZone onData={setHex} />
          <TextField
            value={text}
            label="text"
            multiline
            fullWidth
            size="small"
            InputProps={{ endAdornment: <CopyButton text={text} /> }}
            onChange={(e) => setHex(utf8ToHex(e.currentTarget.value))}
          />
          <TextField
            size="small"
            label="hex"
            value={hex}
            inputProps={{ pattern: '' }}
            fullWidth
            InputProps={{ endAdornment: <CopyButton text={hex} /> }}
            onChange={(e) => setHex(pickHexChar(e.currentTarget.value))}
          />
          <Box display="grid" gap="4px" gridTemplateColumns="1fr auto">
            <TextField
              size="small"
              label={baseEncMode}
              value={base64}
              inputProps={{ pattern: '' }}
              fullWidth
              InputProps={{ endAdornment: <CopyButton text={base64} /> }}
              onChange={(e) =>
                setHex(base64ToHex(pickBase64Char(e.currentTarget.value)))
              }
            />
            <FormControlLabel
              control={
                <Switch
                  onClick={() => setBaseEncMode(toggle(baseEncMode))}
                  checked={baseEncMode === 'base64url'}
                />
              }
              label="url"
              labelPlacement="end"
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {buf.length} Byte
            </Typography>
            <button type="button" className="share" onClick={shareUrl}>
              <FaLink size={12} /> Copy share URL
            </button>
          </Box>
        </div>

        <Panel
          title="Byte View"
          action={
            <ToggleButtonGroup
              value={layout}
              exclusive
              size="small"
              onChange={(_e, value) =>
                setLayout(isLayoutState(value) ? value : 'col8')
              }
              aria-label="blocks alignment"
            >
              <ToggleButton value="fill" aria-label="fill">
                <FaArrowsAltH />
              </ToggleButton>
              <ToggleButton value="col8" aria-label="8 column">
                Col8
              </ToggleButton>
              <ToggleButton value="col4" aria-label="4 column">
                Col4
              </ToggleButton>
            </ToggleButtonGroup>
          }
        >
          <div className="blocks" data-layout={layout}>
            {intNums.map((v, i) => (
              <ByteBlock key={i} c={v} index={i} />
            ))}
          </div>
        </Panel>

        <Panel title="UTF-8 View">
          <div className="blocks">
            {[...text].map((s, i) => (
              <Utf8Block key={i} s={s} />
            ))}
          </div>
          <Utf8Legend />
        </Panel>

        <Panel
          title="Packet View"
          action={
            <ToggleButtonGroup
              value={endian}
              exclusive
              size="small"
              onChange={(_e, value) => setEndian(value === 'BE' ? 'BE' : 'LE')}
              aria-label="endian"
            >
              <ToggleButton value="LE">LE</ToggleButton>
              <ToggleButton value="BE">BE</ToggleButton>
            </ToggleButtonGroup>
          }
        >
          <TextField
            value={format}
            label="format"
            multiline
            fullWidth
            size="small"
            helperText="各1文字が型を表す。前から順にバイトを消費して解釈します"
            onChange={(e) => setFormat(e.currentTarget.value)}
          />
          <div className="cheat">
            {structCheat.map(({ cmd, type }) => (
              <button
                type="button"
                key={cmd}
                className="cheat-item"
                onClick={() => setFormat(format + cmd)}
                title={`add ${cmd} (${type})`}
              >
                <span className="c">{cmd}</span>
                <span className="t">{type}</span>
              </button>
            ))}
            <a
              className="docs"
              href="https://docs.python.org/ja/3/library/struct.html"
              target="_blank"
              rel="noreferrer"
            >
              Python struct docs ↗
            </a>
          </div>
          <div className="blocks" style={{ marginTop: '0.75rem' }}>
            {parsed.map(({ cmd, buf: b }, i) => (
              <TypeBlock key={i} cmd={cmd} buf={b} endian={endian} />
            ))}
          </div>
        </Panel>

        <Panel title="hex" action={<CopyButton text={hexLine} />}>
          <Box className="bytes-line">
            {intNums.map((v, i) => (
              <HoverCell
                key={i}
                index={i}
                text={v.toString(16).padStart(2, '0')}
              />
            ))}
          </Box>
        </Panel>

        <Panel title="int" action={<CopyButton text={intLine} />}>
          <Box className="bytes-line">
            {intNums.map((v, i) => (
              <HoverCell key={i} index={i} text={v} />
            ))}
          </Box>
        </Panel>

        <Panel title="ascii / latin1">
          <Typography variant="caption" color="text.secondary">
            ascii
          </Typography>
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
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              latin1 (binary)
            </Typography>
            <div>
              <CodeLabel text={buf.toString('latin1')} />
            </div>
          </Box>
        </Panel>
      </Style>
    </HoverProvider>
  )
}

const Style = styled.div`
  .forms {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .share {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid #d7ccc8;
    background: #fff;
    color: #795548;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.72rem;
    cursor: pointer;
    &:hover {
      background: #efebe9;
    }
  }

  .panel {
    margin-top: 0.75rem;
    padding: 0.75rem 0.9rem;
    border: 1px solid #ece7e0;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(60, 39, 35, 0.04);
  }
  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #f2ede6;
  }
  .panel-title {
    font-weight: 700;
    color: #5d4037;
  }

  .blocks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    &[data-layout='col8'] {
      display: grid;
      grid-template-columns: repeat(8, max-content);
    }
    &[data-layout='col4'] {
      display: grid;
      grid-template-columns: repeat(4, max-content);
    }
  }

  .bytes-line {
    display: flex;
    flex-wrap: wrap;
  }

  .cheat {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 0.5rem;
  }
  .cheat-item {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    border: 1px solid #e0dcd6;
    background: #fff;
    border-radius: 5px;
    padding: 2px 7px;
    cursor: pointer;
    &:hover {
      background: #fffbeb;
      border-color: #d4a017;
    }
    .c {
      font-family: monospace;
      font-weight: 700;
      color: #795548;
    }
    .t {
      font-size: 0.68rem;
      color: #9e9e9e;
    }
  }
  .docs {
    margin-left: auto;
    font-size: 0.72rem;
    color: #b8860b;
  }
`

export default CodeExplorer
