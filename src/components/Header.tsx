import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import { FaGithub, FaHome } from 'react-icons/fa'
import Link from 'next/link'
import styled from 'styled-components'

type Props = {
  currentPath: string
}

const Header = ({ currentPath }: Props) => {
  const isHome = currentPath === '/'

  return (
    <StyledAppBar position="static" elevation={0}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Link href="/" passHref legacyBehavior>
            <LogoLink>
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}
              >
                anozon
              </Typography>
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 300, opacity: 0.8 }}
              >
                /tools
              </Typography>
            </LogoLink>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isHome && (
            <Link href="/" passHref legacyBehavior>
              <IconButton
                component="a"
                size="small"
                sx={{ color: 'inherit', opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                <FaHome />
              </IconButton>
            </Link>
          )}
          <IconButton
            component="a"
            href="https://github.com/elzup/tools"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ color: 'inherit', opacity: 0.8, '&:hover': { opacity: 1 } }}
          >
            <FaGithub />
          </IconButton>
        </Box>
      </Toolbar>
    </StyledAppBar>
  )
}

const StyledAppBar = styled(AppBar)`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
`

const LogoLink = styled.a`
  display: flex;
  align-items: baseline;
  gap: 2px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`

export default Header
