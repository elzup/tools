import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import { FaGithub } from 'react-icons/fa'
import Link from 'next/link'
import styled from 'styled-components'
import { SITE_REPO } from '../data/sites'
import SiteSwitch from './SiteSwitch'
import { Clock } from './Clock'
import { colors } from './theme'

type Props = {
  currentPath: string
}

const Header = ({ currentPath }: Props) => {
  const isHome = currentPath === '/'

  return (
    <StyledAppBar position="sticky" elevation={0}>
      <StyledToolbar $compact={!isHome}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <StyledLogoLink href="/" $compact={!isHome}>
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
          </StyledLogoLink>
        </Box>

        {/* 並びは docs/site-chrome.md 2 章: サイト固有ウィジェット → switcher → GitHub → theme */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Clock compact={!isHome} />
          <SiteSwitch />
          <IconButton
            component="a"
            href={SITE_REPO}
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

const StyledAppBar = styled(AppBar)`
  background: linear-gradient(
    135deg,
    ${colors.surface.darker} 0%,
    ${colors.surface.dark} 100%
  );
`

const StyledToolbar = styled(Toolbar)<{ $compact: boolean }>`
  min-height: ${({ $compact }) => ($compact ? '48px' : '64px')} !important;
  padding: ${({ $compact }) => ($compact ? '0 16px' : '0 24px')} !important;
`

const StyledLogoLink = styled(Link)<{ $compact: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? '6px' : '8px')};
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;

  svg {
    font-size: ${({ $compact }) => ($compact ? '20px' : '24px')};
  }

  &:hover {
    opacity: 0.85;
  }
`

export default Header
