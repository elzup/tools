import { Button } from '@mui/material'
import { stringify } from 'flatted'
import React from 'react'

const SubWindowParts = () => (
  <div>
    <Button
      color="primary"
      onClick={() => {
        window.open(location.href)
      }}
    >
      {`window.open(location.href)`}
    </Button>
    <Button
      color="primary"
      onClick={() => {
        window.open(location.href, '_blank', 'height=300,width=300')
      }}
    >
      {`window.open(location.href, '_blank', 'height=300,width=300')`}
    </Button>

    <pre>
      <code>{stringify(window.opener, null, ' ')}</code>
    </pre>
  </div>
)

export default SubWindowParts
