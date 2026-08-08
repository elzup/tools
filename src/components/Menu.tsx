import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Typography } from '@mui/material'
import Link from 'next/link'
import { useState } from 'react'
import useKey from 'react-use/lib/useKey'
import styled from 'styled-components'
import {
  recentGroup,
  routings,
  secretRoutings,
  type Routing,
} from '../data/menu'

function MenuItem({ routing, opened }: { routing: Routing; opened: boolean }) {
  return (
    <div className="item">
      <FontAwesomeIcon icon={routing.icon} />
      {opened ? (
        <Typography>{routing.label}</Typography>
      ) : (
        <Link href={routing.path}>
          <Typography>{routing.label}</Typography>
        </Link>
      )}
    </div>
  )
}

type Props = {
  currentPath: string
}

const FRAMED_LABELS = new Set(['Recent', 'Draft', 'Closed'])

const Menu = ({ currentPath }: Props) => {
  const [showSecret, setShowSecret] = useState(false)

  // show secret while Alt is pressed
  const toggleSecret = () => setShowSecret((prev) => !prev)
  useKey('Alt', toggleSecret)

  const allRoutings = showSecret
    ? [...routings, ...secretRoutings, recentGroup]
    : [...routings, recentGroup]

  return (
    <nav>
      <Style>
        {allRoutings.map((group) => (
          <div
            key={group.label}
            className={
              showSecret && group.label === 'Secret Tools'
                ? 'secret-group'
                : FRAMED_LABELS.has(group.label)
                  ? 'framed-group'
                  : ''
            }
          >
            <Typography>{group.label}</Typography>
            {group.routings.map((routing) => (
              <MenuItem
                routing={routing}
                data-qa={routing.path}
                opened={routing.path === currentPath}
                key={routing.path}
              />
            ))}
          </div>
        ))}
      </Style>
    </nav>
  )
}

const Style = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  > div {
    > p {
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.5;
      margin-bottom: 0.75rem;
    }
  }

  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;

    svg {
      min-width: 1rem;
      width: 1rem;
      opacity: 0.7;
    }

    a {
      color: inherit;
      text-decoration: none;
      opacity: 0.85;
      transition: opacity 0.2s;
      font-size: 0.875rem;

      &:hover {
        opacity: 1;
      }
    }

    p {
      font-size: 0.875rem;
      opacity: 0.5;
    }
  }

  .secret-group {
    background: rgba(255, 100, 100, 0.1);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .framed-group {
    background: rgba(128, 128, 128, 0.1);
    border-radius: 8px;
    padding: 0.75rem;
  }
`

export default Menu
