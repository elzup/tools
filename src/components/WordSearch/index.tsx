import { TextField } from '@mui/material'
import React, { useState } from 'react'

type Props = {}
function WordSearch(props: Props) {
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
