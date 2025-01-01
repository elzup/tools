import { Box, Button, Container, TextField, Typography } from '@mui/material'
import CryptoJS from 'crypto-js'
import { QRCodeSVG } from 'qrcode.react'
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

const Logicript: React.FC = () => {
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
        QRコード生成フォーム
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 3 }}
      >
        <TextField
          fullWidth
          label="氏名"
          margin="normal"
          {...register('name', { required: '氏名は必須です' })}
          error={!!errors.name}
          helperText={errors.name?.message}
        />

        <TextField
          fullWidth
          label="年齢"
          type="number"
          margin="normal"
          {...register('age', {
            required: '年齢は必須です',
            min: { value: 0, message: '年齢は0以上にしてください' },
            max: { value: 120, message: '年齢は120以下にしてください' },
          })}
          error={!!errors.age}
          helperText={errors.age?.message}
        />

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
          <Typography variant="h6">QRコード:</Typography>
          <Suspense fallback={<div>invalid</div>}>
            <QRCodeSVG value={qrValue} level="L" />
          </Suspense>
        </Box>
      )}
    </Container>
  )
}

export default Logicript
