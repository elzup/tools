import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import { FaGithub, FaHome } from 'react-icons/fa'
import Link from 'next/link'
import styled from 'styled-components'
import { colors } from './theme'

type Props = {
  currentPath: string
}

const Header = ({ currentPath }: Props) => {
  const isHome = currentPath === '/'

  return (
    <StyledAppBar position="static" elevation={0} $compact={!isHome}>
      <StyledToolbar $compact={!isHome}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Link href="/" passHref legacyBehavior>
            <LogoLink $compact={!isHome}>
              <FontAwesomeIcon icon={faSatellite} />
              <Typography
                variant={isHome ? 'h6' : 'body1'}
                component="span"
                sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}
              >
                anozon
              </Typography>
              <Typography
                variant={isHome ? 'h6' : 'body1'}
                component="span"
                sx={{ fontWeight: 300, opacity: 0.8 }}
              >
                /tools
              </Typography>
            </LogoLink>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
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
      </StyledToolbar>
    </StyledAppBar>
  )
}

const StyledAppBar = styled(AppBar)<{ $compact: boolean }>`
  background: linear-gradient(135deg, ${colors.surface.darker} 0%, ${colors.surface.dark} 100%);
`

const StyledToolbar = styled(Toolbar)<{ $compact: boolean }>`
  min-height: ${({ $compact }) => ($compact ? '40px' : '64px')} !important;
  padding: ${({ $compact }) => ($compact ? '0 16px' : '0 24px')} !important;
`

const LogoLink = styled.a<{ $compact: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? '6px' : '8px')};
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;

  svg {
    font-size: ${({ $compact }) => ($compact ? '1rem' : '1.25rem')};
  }

  &:hover {
    opacity: 0.85;
  }
`

export default Header
