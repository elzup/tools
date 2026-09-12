import { Box, Collapse, Container, Divider, IconButton } from '@mui/material'
import { FaChevronDown, FaChevronUp, FaGithub } from 'react-icons/fa'
import { useState } from 'react'
import styled from 'styled-components'
import { SITE_NAME, SITE_REPO, SITE_TAGLINE } from '../data/sites'
import Menu from './Menu'
import SiteSwitch from './SiteSwitch'
import { colors } from './theme'

export type FooterMode = 'full' | 'minimal' | 'hidden'

type Props = {
  currentPath: string
  mode?: FooterMode
}

// 構成は docs/site-chrome.md 4 章 (math-kb の SiteFooter と同じ mode 構成)
const Footer = ({ currentPath, mode = 'full' }: Props) => {
  const [expanded, setExpanded] = useState(false)

  if (mode === 'hidden') return null

  if (mode === 'minimal') {
    return (
      <StyledFooter $minimal>
        <Container maxWidth="lg">
          <MinimalRow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tagline>{SITE_NAME}</Tagline>
              <SiteSwitch alwaysLabel />
              <FooterLink
                href={SITE_REPO}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
              >
                <FaGithub aria-hidden="true" />
              </FooterLink>
            </Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? 'メニューを閉じる' : 'メニューを開く'}
              sx={{ color: 'inherit', opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              {expanded ? <FaChevronDown /> : <FaChevronUp />}
            </IconButton>
          </MinimalRow>

          <Collapse in={expanded}>
            <Box sx={{ pt: 2 }}>
              <Menu currentPath={currentPath} />
            </Box>
          </Collapse>
        </Container>
      </StyledFooter>
    )
  }

  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <Menu currentPath={currentPath} />

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

        <BottomRow>
          <Tagline>{SITE_TAGLINE}</Tagline>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <SiteSwitch alwaysLabel />
            <FooterLink
              href={SITE_REPO}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub aria-hidden="true" />
              <span>GitHub</span>
            </FooterLink>
          </Box>
        </BottomRow>
      </Container>
    </StyledFooter>
  )
}

const StyledFooter = styled.footer<{ $minimal?: boolean }>`
  background: linear-gradient(
    135deg,
    ${colors.surface.darker} 0%,
    ${colors.surface.dark} 100%
  );
  color: #fff;
  padding: ${({ $minimal }) => ($minimal ? '0.75rem 0' : '3rem 0 2rem')};
  margin-top: auto;
`

const MinimalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`

const Tagline = styled.span`
  font-size: 0.875rem;
  opacity: 0.7;
`

const FooterLink = styled.a`
  display: flex;
  align-items: center;
  gap: 4px;
  color: inherit;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  font-size: 0.875rem;

  &:hover {
    opacity: 1;
  }
`

export default Footer
