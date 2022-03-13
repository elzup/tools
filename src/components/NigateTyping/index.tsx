import { Box, Container, TextField, Typography } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { asciify } from '../../utils'
import { useLocalStorage } from '../../utils/useLocalStorage'
import TypingPractice from './TypingPractice'

function useNigateWords() {
  const [words, setWords] = useLocalStorage<string>('nigate-words', '')

  return { words, setWords }
}

function NigateTyping() {
  const { words, setWords } = useNigateWords()
  const practiceWords = words.split('\n').filter(Boolean)

  return (
    <Style>
      <Container>
        <Box m={1}>
          <Typography>
            半角文字のみです。改行区切りです。保存されます。スコアなどはありません。
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '1rem',
          }}
        >
          <Box mt={2}>
            <TextField
              label="練習リスト"
              multiline
              onChange={(e) => {
                setWords(asciify(e.currentTarget.value))
              }}
              value={words}
            />
          </Box>
          <Box mt={2} style={{ display: 'grid', gap: '12px' }}>
            {practiceWords.length === 0 && (
              <Typography>←練習する単語を登録してください</Typography>
            )}
            {practiceWords.map((word, i) => (
              <TypingPractice key={i} word={word} />
            ))}
          </Box>
        </Box>
      </Container>
    </Style>
  )
}

const Style = styled.div``

export default NigateTyping
