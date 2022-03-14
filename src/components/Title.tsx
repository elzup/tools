import { Typography } from '@mui/material'
import React from 'react'

export const Title: React.FC = ({ children }) => {
  return (
    <Typography variant="h3" component="h1">
      {children}
    </Typography>
  )
}
