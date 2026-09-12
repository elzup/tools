import styled from 'styled-components'
import { ANOZON_SITES, SITE_ID } from '../data/sites'

type Props = {
  // フッターでは常にラベルを出す。ヘッダーは 640px 未満でアイコンのみ
  alwaysLabel?: boolean
}

const SiteSwitch = ({ alwaysLabel = false }: Props) => {
  const siblings = ANOZON_SITES.filter((site) => site.id !== SITE_ID)

  return (
    <Style $alwaysLabel={alwaysLabel}>
      {siblings.map(({ id, label, href, icon: Icon }) => (
        <a key={id} href={href} className="site-switch-link" title={label}>
          <Icon aria-hidden="true" />
          <span className="site-switch-label">{label}</span>
        </a>
      ))}
    </Style>
  )
}

const Style = styled.div<{ $alwaysLabel: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;

  .site-switch-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: inherit;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .site-switch-link:hover {
    opacity: 1;
  }

  .site-switch-label {
    display: ${({ $alwaysLabel }) => ($alwaysLabel ? 'inline' : 'none')};
  }

  @media (min-width: 640px) {
    .site-switch-label {
      display: inline;
    }
  }
`

export default SiteSwitch
