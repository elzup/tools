import { createTheme } from '@mui/material'
import { brown, green, red } from '@mui/material/colors'
import { createGlobalStyle } from 'styled-components'
import { config, dom } from '@fortawesome/fontawesome-svg-core'

config.autoAddCss = false

export const GlobalStyle = createGlobalStyle`
${dom.css()}
html,
body {
  height: 100%;
  margin: 0;
}
`

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

    h1: { fontSize: 60 },
    h2: { fontSize: 48 },
    h3: { fontSize: 42 },
    h4: { fontSize: 36 },
    h5: { fontSize: 20 },
    h6: { fontSize: 18 },
    subtitle1: { fontSize: 18 },
    body1: { fontSize: 16 },
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
