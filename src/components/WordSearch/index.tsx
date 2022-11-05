import { TextField } from '@mui/material'
import React, { useState } from 'react'

function WordSearch() {
  const [q, setQ] = useState<string>('')

  return (
    <div>
      <TextField
        value={q}
        onChange={({ target: { value } }) => setQ(value)}
      ></TextField>
    </div>
  )
}
export default WordSearch
