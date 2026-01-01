import { createTheme } from '@mui/material'
import { createGlobalStyle } from 'styled-components'

// カラーパレット定義
export const colors = {
  brown: {
    light: '#d7ccc8',
    main: '#795548',
    dark: '#5d4037',
    darker: '#3e2723',
  },
  gold: {
    light: '#fff8e1',
    main: '#d4a017',
    dark: '#b8860b',
  },
  grey: {
    light: '#f5f5f5',
    main: '#9e9e9e',
    dark: '#616161',
    darker: '#212121',
  },
  // Header/Footer用
  surface: {
    dark: '#2d2520',
    darker: '#1a1512',
  },
} as const

export const GlobalStyle = createGlobalStyle`
html,
body {
  height: 100%;
  margin: 0;
}
`

export const defaultTheme = createTheme({})
const { pxToRem } = defaultTheme.typography

const headStyle = { paddingTop: '.6rem', paddingBottom: '.4rem' }

export const theme = createTheme({
  palette: {
    primary: {
      light: colors.brown.light,
      main: colors.brown.main,
      dark: colors.brown.dark,
    },
    secondary: {
      light: colors.gold.light,
      main: colors.gold.main,
      dark: colors.gold.dark,
    },
    info: {
      light: colors.grey.light,
      main: colors.grey.main,
      dark: colors.grey.dark,
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: "'Work Sans', sans-serif",
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 700,

    h1: { fontSize: pxToRem(60) },
    h2: { fontSize: pxToRem(48), ...headStyle },
    h3: { fontSize: pxToRem(42), ...headStyle },
    h4: { fontSize: pxToRem(36), ...headStyle },
    h5: { fontSize: pxToRem(20), ...headStyle },
    h6: { fontSize: pxToRem(18), ...headStyle },
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
