import { convertUrlToBadge } from '../gha-badge-maker'

test('convertUrlToBadge', () => {
  const url = 'https://github.com/elzup/tools/actions?query=workflow%3Aqawolf'

  expect(convertUrlToBadge(url)).toMatchObject({
    badgeText:
      '![qawolf](https://github.com/elzup/tools/workflows/qawolf/badge.svg)',
    actionName: 'qawolf',
    badgeUrl: 'https://github.com/elzup/tools/workflows/qawolf/badge.svg',
  })
})
