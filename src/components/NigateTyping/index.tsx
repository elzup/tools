import { Box, Container, TextField } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { useLocalStorage } from '../../utils/useLocalStorage'

function useNigateWords() {
  const [words, setWords] = useLocalStorage<string>('nigate-words', '')

  return {
    words,
    setWords,
  }
}

function NigateTyping() {
  const { words, setWords } = useNigateWords()

  return (
    <Style>
      <Container>
        <Box mt={2}>
          <TextField
            label="練習リスト"
            multiline
            onChange={(e) => {
              setWords(e.currentTarget.value)
            }}
            value={words}
          />
        </Box>
      </Container>
    </Style>
  )
}

const Style = styled.div``

export default NigateTyping
