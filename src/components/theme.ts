import { createTheme } from '@mui/material'
import { brown, green, red } from '@mui/material/colors'
import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
html,
body {
  height: 100%;
  margin: 0;
}
`

export const defaultTheme = createTheme({})
const { pxToRem } = defaultTheme.typography

export const theme = createTheme({
  palette: {
    primary: {
      light: brown[50],
      main: brown[500],
      dark: brown[700],
    },
    secondary: {
      light: '#fff5f8',
      main: '#ff3366',
      dark: '#e62958',
    },
    warning: {
      main: '#ffc071',
      dark: '#ffb25e',
    },
    error: {
      light: red[50],
      main: red[500],
      dark: red[700],
    },
    success: {
      light: green[50],
      main: green[500],
      dark: green[700],
    },
  },
  typography: {
    fontFamily: "'Work Sans', sans-serif",
    fontSize: 14,
    fontWeightLight: 300, // Work Sans
    fontWeightRegular: 400, // Work Sans
    fontWeightMedium: 700, // Roboto Condensed

    h1: { fontSize: pxToRem(60) },
    h2: { fontSize: pxToRem(48) },
    h3: { fontSize: pxToRem(42) },
    h4: { fontSize: pxToRem(36) },
    h5: { fontSize: pxToRem(20) },
    h6: { fontSize: pxToRem(18) },
    subtitle1: { fontSize: pxToRem(18) },
    body1: { fontSize: pxToRem(16) },
    button: { textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
    },
  },
})
