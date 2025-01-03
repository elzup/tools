import { Box, Button, Container, TextField, Typography } from '@mui/material'
import CryptoJS from 'crypto-js'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMagironic } from '../../lib/magironic/useMagironic'

type FormData = {
  name: string
  age: number
  description: string
}
const secretKey = ''
const encryptData = (text: string) => {
  return CryptoJS.AES.encrypt(text, secretKey).toString()
}
const maxChar = 1000

const Magironic = () => {
  const {
    getValues,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      age: 0,
      description: '',
    },
  })
  const magi = useMagironic(getValues().description)

  const [descriptionLength, setDescriptionLength] = useState(0)
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescriptionLength(e.target.value.length)
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Magironic 原始テキスト
      </Typography>
      <Box component="form" noValidate sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label={`テキスト [${descriptionLength}/${maxChar}]`}
          margin="normal"
          multiline
          rows={4}
          {...register('description', {
            required: 'テキストは必須です',
            maxLength: {
              value: maxChar,
              message: `${maxChar}文字以内で入力してください`,
            },
          })}
          onChange={handleDescriptionChange}
          error={!!errors.description}
          helperText={errors.description?.message}
        />

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          生成
        </Button>
      </Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
      >
        <Box>{JSON.stringify(magi)}</Box>
        <Box></Box>
      </Box>
    </Container>
  )
}

export default Magironic
