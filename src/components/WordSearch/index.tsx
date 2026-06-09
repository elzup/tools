import {
  Box,
  Chip,
  FormControlLabel,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../Layout'
import { Title } from '../Title'

export type WordEntry = {
  surface: string
  reading: string
}

type SearchResult = WordEntry & {
  matchedBy: '表記' | '読み' | '両方'
}

const title = '虫食い検索'
const sourceRepositoryUrl = 'https://github.com/elzup/jlpt-word-list'
const singleCharWildcards = new Set(['?', '？', '_', '＿', '□', '○', '〇'])
const multiCharWildcards = new Set(['*', '＊', '…'])
const maxResults = 200

export function parseWordCsv(text: string): WordEntry[] {
  return text
    .trim()
    .split('\n')
    .map((line) => {
      const [surface, reading] = line.split(',')
      return { surface, reading }
    })
    .filter(({ surface, reading }) => surface && reading)
}

function toHiragana(text: string) {
  return text.replace(/[ァ-ン]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  )
}

function normalizePattern(text: string) {
  return toHiragana(text.trim().replace(/\s+/g, ''))
}

function escapeRegExp(char: string) {
  return char.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
}

export function createMushikuiRegex(pattern: string): RegExp | null {
  const normalizedPattern = normalizePattern(pattern)
  if (!normalizedPattern) return null

  const source = [...normalizedPattern]
    .map((char) => {
      if (singleCharWildcards.has(char)) return '.'
      if (multiCharWildcards.has(char)) return '.*'
      return escapeRegExp(char)
    })
    .join('')

  return new RegExp(`^${source}$`, 'u')
}

function resolveMatchedBy(
  surfaceMatched: boolean,
  readingMatched: boolean
): SearchResult['matchedBy'] {
  if (surfaceMatched && readingMatched) return '両方'
  if (readingMatched) return '読み'
  return '表記'
}

export function searchWords(
  words: WordEntry[],
  pattern: string,
  shouldMatchReading: boolean
): SearchResult[] {
  const regex = createMushikuiRegex(pattern)
  if (!regex) return []

  return words
    .map((word) => {
      const surfaceMatched = regex.test(normalizePattern(word.surface))
      const readingMatched =
        shouldMatchReading && regex.test(normalizePattern(word.reading))

      if (!surfaceMatched && !readingMatched) return null

      return {
        ...word,
        matchedBy: resolveMatchedBy(surfaceMatched, readingMatched),
      }
    })
    .filter((word): word is SearchResult => word !== null)
}

function useWords() {
  const [words, setWords] = useState<WordEntry[] | null>(null)

  useEffect(() => {
    fetch('/words.nohead.csv')
      .then(async (res) => {
        const text = await res.text()
        setWords(parseWordCsv(text))
      })
      .catch(() => setWords([]))
  }, [])

  return words
}

function WordSearch() {
  const words = useWords()
  const [pattern, setPattern] = useState<string>('??ば')
  const [shouldMatchReading, setShouldMatchReading] = useState<boolean>(true)
  const results = useMemo(
    () => searchWords(words ?? [], pattern, shouldMatchReading),
    [pattern, shouldMatchReading, words]
  )
  const visibleResults = results.slice(0, maxResults)
  const isLoading = words === null

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              データ元:{' '}
              <Link
                href={sourceRepositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                elzup/jlpt-word-list
              </Link>
              {' '}を元にしたローカル辞書 /words.nohead.csv
            </Typography>
            <TextField
              label="虫食いパターン"
              value={pattern}
              fullWidth
              onChange={({ target: { value } }) => setPattern(value)}
              helperText="? は1文字、* は0文字以上に一致します。例: ??ば / か*い / お□さん"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shouldMatchReading}
                  onChange={(_, checked) => setShouldMatchReading(checked)}
                />
              }
              label="読みも検索する"
            />
          </Stack>
        </Paper>

        {isLoading ? (
          <LinearProgress />
        ) : (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">検索結果</Typography>
              <Chip label={`${results.length}件`} size="small" />
              {results.length > maxResults && (
                <Chip label={`先頭${maxResults}件を表示`} size="small" />
              )}
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>表記</TableCell>
                    <TableCell>読み</TableCell>
                    <TableCell>一致</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleResults.map(({ surface, reading, matchedBy }) => (
                    <TableRow key={`${surface}-${reading}`}>
                      <TableCell>{surface}</TableCell>
                      <TableCell>{reading}</TableCell>
                      <TableCell>{matchedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Stack>
    </Layout>
  )
}

export default WordSearch
