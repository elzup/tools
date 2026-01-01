import { Box, Collapse, Container, Divider, IconButton, Typography } from '@mui/material'
import { FaChevronDown, FaChevronUp, FaGithub, FaGlobe } from 'react-icons/fa'
import { useState } from 'react'
import styled from 'styled-components'
import Menu from './Menu'
import { colors } from './theme'

export type FooterMode = 'full' | 'minimal' | 'hidden'

type Props = {
  currentPath: string
  mode?: FooterMode
}

const Footer = ({ currentPath, mode = 'full' }: Props) => {
  const [expanded, setExpanded] = useState(false)

  if (mode === 'hidden') return null

  if (mode === 'minimal') {
    return (
      <StyledFooter $minimal>
        <Container maxWidth="lg">
          <MinimalSection>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                anozon/tools
              </Typography>
              <FooterLink href="https://anozon.me" target="_blank" rel="noopener noreferrer">
                <FaGlobe />
              </FooterLink>
              <FooterLink href="https://github.com/elzup/tools" target="_blank" rel="noopener noreferrer">
                <FaGithub />
              </FooterLink>
            </Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'inherit', opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              {expanded ? <FaChevronDown /> : <FaChevronUp />}
            </IconButton>
          </MinimalSection>

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

        <BottomSection>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            mini web tools by anozon
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FooterLink href="https://anozon.me" target="_blank" rel="noopener noreferrer">
              <FaGlobe />
              <span>anozon.me</span>
            </FooterLink>
            <FooterLink href="https://github.com/elzup/tools" target="_blank" rel="noopener noreferrer">
              <FaGithub />
              <span>GitHub</span>
            </FooterLink>
          </Box>
        </BottomSection>
      </Container>
    </StyledFooter>
  )
}

const StyledFooter = styled.footer<{ $minimal?: boolean }>`
  background: linear-gradient(135deg, ${colors.surface.darker} 0%, ${colors.surface.dark} 100%);
  color: #fff;
  padding: ${({ $minimal }) => ($minimal ? '0.75rem 0' : '3rem 0 2rem')};
  margin-top: auto;
`

const MinimalSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const BottomSection = styled.div`
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
