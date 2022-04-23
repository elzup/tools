import { faCopy } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Grid, Link, TextField, Typography } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { dictionaries } from 'tequery/dist/dictionary'
import { useClipsh } from './useClipsh'

function ClipshContent() {
  const clipsh = useClipsh()

  console.log(dictionaries)

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
            clipsh.teq.status === 'ng' &&
            clipsh.teq.errorText.replace('eval', 'calc')
          }
          onChange={(e) => clipsh.setQuery(e.target.value)}
        />
        <div style={{ display: 'flex' }}>
          <code>
            <pre className="eval-code">{clipsh.teq.evalQuery}</pre>
          </code>
        </div>
      </Box>
      <Box p={'.5rem'} style={{ display: 'flex' }}>
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
            <Typography>clipboard</Typography>
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
    font-size: 0.8rem;
    background: #bbb;
    padding: 0 1rem;
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
`

export default ClipshContent
