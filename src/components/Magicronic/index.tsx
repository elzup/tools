import { Box, Button, Container, TextField, Typography } from '@mui/material'
import CryptoJS from 'crypto-js'
import React, { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'

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

const Magicronic = () => {
  const {
    getValues,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()
  const [qrValue, setQRValue] = useState<string | null>(null)

  const onSubmit = (data: FormData) => {
    const jsonData = JSON.stringify(data)

    const encrypted = encryptData(jsonData)

    console.log('json:', jsonData.length)
    console.log('encrypted:', encrypted.length)

    setQRValue(encrypted) // QRコードに表示するJSONデータ
  }
  const [descriptionLength, setDescriptionLength] = useState(0)
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescriptionLength(e.target.value.length)
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Magicronic 原始テキスト
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 3 }}
      >
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

      {qrValue && (
        <Box mt={4} textAlign="center">
          <Suspense fallback={<div>invalid</div>}>{'todo'}</Suspense>
        </Box>
      )}
    </Container>
  )
}

export default Magicronic
