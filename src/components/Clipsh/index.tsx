import { Box, TextField, Typography } from '@mui/material'
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
        <Typography>{clipsh.teq.status}</Typography>
        <code>
          <pre>{clipsh.teq.evalQuery}</pre>
        </code>
        <code>
          <pre>{clipsh.teq.errorText}</pre>
        </code>
      </Box>
      <Box
        style={{
          marginLeft: '8px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <Box>
          <TextField
            value={clipsh.base}
            multiline
            fullWidth
            onChange={(e) => clipsh.setBase(e.target.value)}
          />
        </Box>
        <Box style={{ marginLeft: '8px' }}>
          <code>
            <pre>{clipsh.teq.result}</pre>
          </code>
        </Box>
      </Box>
    </Style>
  )
}

const Style = styled.div``

export default ClipshContent
