import { Typography } from '@mui/material'
import React from 'react'
import { WithChild } from '../types'

export const Title = ({ children }: WithChild) => {
  return (
    <Typography variant="h3" component="h1">
      {children}
    </Typography>
  )
}
