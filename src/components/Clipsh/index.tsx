import { Box, Button, Grid, Link, TextField, Typography } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { descriptions } from './tequery-consts'
import { useClipsh } from './useClipsh'

function ClipshContent() {
  const clipsh = useClipsh()

  return (
    <Style>
      <Box m={'1rem'}>
        <Typography>
          Query using{' '}
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
      <Box style={{ display: 'flex' }}>
        <Box style={{ display: 'grid' }}>
          {descriptions.vars.map(({ code, desc }) => (
            <div key={code}>
              <Button
                size={'small'}
                onClick={() => {
                  clipsh.setQuery((v) => v + code)
                }}
              >
                {code}
              </Button>
              {desc}
            </div>
          ))}
        </Box>
        <Box style={{ display: 'grid' }}>
          {descriptions.funcs.map(({ code, desc }) => (
            <div key={code}>
              <Button
                size={'small'}
                onClick={() => {
                  clipsh.setQuery((v) => v + code)
                }}
              >
                {code}
              </Button>
              {desc}
            </div>
          ))}
        </Box>
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
            <Typography>output</Typography>
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
`

export default ClipshContent
