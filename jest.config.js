module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testPathIgnorePatterns: ['.qawolf/', 'e2e'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}