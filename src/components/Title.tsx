import { Typography } from '@mui/material'
import React from 'react'

export const Title = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Typography variant="h3" component="h1">
      {children}
    </Typography>
  )
}
