import { TextField } from '@mui/material'
import React, { useState, useEffect } from 'react'

function useWords() {
  const [words, setWords] = useState<string[] | null>(null)

  useEffect(() => {
    fetch('/words.nohead.csv').then(async (res) => {
      const text = await res.text()

      text
        .trim()
        .split('\n')
        .map((line) => line.split(','))
    })
  }, [setWords])

  return words
}

function Component() {
  const words = useWords()
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
export default Component
