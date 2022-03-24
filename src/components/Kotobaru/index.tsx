import { TextField } from '@mui/material'
import React, { useState } from 'react'
import { useWordle } from './useWordle'

function Kotobaru() {
  const words = useWordle()
  const [filter, setFilter] = useState<string>('')

  if (words) return <p>loading</p>

  return (
    <div>
      <TextField
        value={filter}
        onChange={({ target: { value } }) => setFilter(value)}
      ></TextField>
    </div>
  )
}

export default Kotobaru
