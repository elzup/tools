module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testPathIgnorePatterns: ['.qawolf/', 'e2e', '.next/', 'node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    // pnpm の node_modules/.pnpm/<pkg>/node_modules/<pkg> 構造に対応するため
    // 先頭の .pnpm セグメントを除外対象から外し、内側のパッケージ名で判定する
    '/node_modules/(?!(\\.pnpm|d3|d3-.+|internmap|delaunator|robust-predicates)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  watchman: false,
}
