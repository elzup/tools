import { kindof } from '@elzup/kindof'
import { faCopy, faPaste } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Grid, Link, TextField, Typography } from '@mui/material'
import styled from 'styled-components'
import { dictionaries } from 'tequery/dist/dictionary'
import { useShowDict } from '../../store'
import { Box } from '../common/mui'
import { useClipsh } from './useClipsh'

const makePreviewPre = (resultRaw: unknown): string => {
  switch (typeof resultRaw) {
    case 'object':
      return (
        JSON.stringify(Array.isArray(resultRaw) ? resultRaw[0] : resultRaw) ||
        ''
      )
    default:
      return String(resultRaw)
  }
}
const makePreview = (resultRaw: unknown): string =>
  makePreviewPre(resultRaw).split('\n')[0].slice(0, 20)

function ClipshContent() {
  const clipsh = useClipsh()
  const { showDict, toggleShowDict } = useShowDict()

  const typeLabel = (() => {
    const returnKind = kindof(clipsh.teq.resultRaw)
    const { returnType } = clipsh.teq

    return returnKind === returnType
      ? returnKind
      : `${returnType}(${returnKind})`
  })()

  const resultPreview = makePreview(clipsh.teq.resultRaw)

  return (
    <Style>
      <Box m={'1rem'}>
        <Typography>
          clipboard text convert quickly. Query using{' '}
          <Link href="https://github.com/elzup/tequery" target="_blank">
            tequery
          </Link>
        </Typography>
        <TextField
          style={{ marginTop: '0.4rem' }}
          value={clipsh.query}
          fullWidth
          label="Query"
          error={clipsh.teq.status === 'ng'}
          helperText={
            (clipsh.teq.status === 'ng' &&
              clipsh.teq.errorText.replace('eval', 'calc')) ||
            ' '
          }
          onChange={(e) => clipsh.setQuery(e.target.value)}
        />
        <div style={{ display: 'flex' }}>
          <code className="eval-code">
            <pre style={{ background: '#ded' }}>{'builded'}</pre>
            <pre>{clipsh.teq.evalQuery || ' '}</pre>
          </code>
          <code className="eval-code">
            <pre style={{ background: '#dde' }}>{'=> type'}</pre>
            <pre>{typeLabel}</pre>
          </code>
          <code className="eval-code">
            <pre style={{ background: '#dde' }}>{'=> raw'}</pre>
            <pre>{resultPreview}</pre>
          </code>
        </div>
      </Box>
      <Box p={'1rem'} className="suggestions">
        {clipsh.suggestions.map(({ dict }, k) => (
          <div key={dict.name} data-kb={k}>
            <Button
              variant="outlined"
              size={'small'}
              data-category={'func'}
              onClick={() => clipsh.setQuery((v) => v + dict.code)}
            >
              {dict.code}
            </Button>
          </div>
        ))}
      </Box>
      <Button onClick={toggleShowDict}>Dict{showDict ? '▼' : '▶'}</Button>
      <Box p={'1rem'} sx={{ display: showDict ? 'flex' : 'none' }}>
        {[
          dictionaries.funcs.map((v) => ({ ...v, category: 'func' })),
          dictionaries.vars.map((v) => ({ ...v, category: 'var' })),
        ].map((descs, k) => (
          <Box key={k}>
            {descs.map((des) => (
              <div key={des.code} data-kb={k}>
                <Button
                  variant="outlined"
                  size={'small'}
                  data-category={des.category}
                  onClick={() => clipsh.setQuery((v) => v + des.code)}
                >
                  {des.code}
                </Button>
                <Box sx={{ display: 'grid' }}>
                  <Typography variant="caption">{des.desc}</Typography>
                  <Typography variant="caption">{des.docCode}</Typography>
                </Box>
              </div>
            ))}
          </Box>
        ))}
      </Box>
      <Grid container>
        <Grid item xs={12} sm={12} md={6}>
          <Box m={'0.5rem'} className="input">
            <Typography>
              input
              <Button onClick={() => clipsh.syncClipboard()}>
                <FontAwesomeIcon icon={faPaste} />
              </Button>
            </Typography>
            <TextField
              value={clipsh.base}
              multiline
              fullWidth
              style={{ fontSize: '0.8rem' }}
              onChange={(e) => clipsh.setBase(e.target.value)}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box m={'0.5rem'} className="output">
            <Typography>
              output
              <Button onClick={() => clipsh.saveText()}>
                <FontAwesomeIcon icon={faCopy} />
              </Button>
            </Typography>
            <code>
              <pre>{clipsh.teq.result}</pre>
            </code>
            {JSON.stringify(clipsh.meta)}
          </Box>
        </Grid>
      </Grid>
    </Style>
  )
}

const Style = styled.div`
  code {
    overflow: scroll;
  }
  .eval-code {
    display: flex;
    font-size: 0.8rem;
    margin: 4px;
    padding: 0px 8px 4px;
    pre {
      margin: 0;
      background: #bbb;
      padding: 2px 4px 4px;
    }
  }
  .input {
  }
  .output {
    pre {
      margin: 0;
      padding: 0.4rem;
      overflow: scroll;
      border: solid 1px #1d321b;
      background: #99be94;
      border-radius: 4px;
    }
  }
  [data-kb] {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }
  button {
    &[data-category='func'] {
      background: #f0faaa;
    }
    &[data-category='var'] {
      background: #aaf0f0;
    }
  }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    button {
    }
  }
`

export default ClipshContent
