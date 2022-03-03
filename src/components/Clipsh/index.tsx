import { Box, Grid, Link, TextField, Typography } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { useClipsh } from './useClipsh'

function ClipshContent() {
  const clipsh = useClipsh()

  return (
    <Style>
      <Box m={'1rem'}>
        <TextField
          value={clipsh.query}
          fullWidth
          label="Query"
          onChange={(e) => clipsh.setQuery(e.target.value)}
        />
        <Typography>
          Query using{' '}
          <Link href="https://github.com/elzup/tequery">tequery</Link>
        </Typography>
        <div style={{ display: 'flex' }}>
          <Typography>compile: {clipsh.teq.status}</Typography>
          <code>
            <pre>{clipsh.teq.evalQuery}</pre>
          </code>
        </div>
        <code>
          <pre>{clipsh.teq.errorText}</pre>
        </code>
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={12} md={6}>
          <Box m={'0.5rem'} style={{ fontSize: '.8rem' }}>
            <TextField
              value={clipsh.base}
              multiline
              fullWidth
              onChange={(e) => clipsh.setBase(e.target.value)}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box m={'0.5rem'} style={{ overflow: 'scroll' }}>
            <code>
              <pre>{clipsh.teq.result}</pre>
            </code>
          </Box>
        </Grid>
      </Grid>
    </Style>
  )
}

const Style = styled.div``

export default ClipshContent
