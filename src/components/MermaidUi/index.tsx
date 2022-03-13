import { TextField } from '@mui/material'
import React, { useState } from 'react'
import MmdGraph from '../MmdGraph'
import { useFetch } from './useFetch'

// const config = {
//   startOnLoad: true,
//   flowchart: {
//     useMaxWidth: true,
//     htmlLabels: true,
//     curve: 'cardinal',
//   },
//   securityLevel: 'loose',
// }

function MurmaidUi() {
  const [url, setUrl] = useState<string>(
    'https://raw.githubusercontent.com/elzup/story-plots/main/sample/min-flow.mmd'
  )
  const { data, error: _error } = useFetch(url)
  const mmd = data?.split('\n').slice(0, 1000).join('\n')

  return (
    <div>
      <TextField
        label="url"
        multiline
        fullWidth
        defaultValue={url}
        onChange={(e) => {
          setUrl(e.currentTarget.value)
        }}
      />
      {mmd && <MmdGraph mmd={mmd} />}
    </div>
  )
}

export default MurmaidUi
