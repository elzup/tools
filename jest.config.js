module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testPathIgnorePatterns: ['.qawolf/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}
