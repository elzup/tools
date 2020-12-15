import * as React from 'react'
import {
  Button,
  Card,
  Form,
  Grid,
  Header,
  Icon,
  Image,
  Input,
} from 'semantic-ui-react'
import Layout from '../components/Layout'

const title = 'XSSデモ'
const NoOpener = () => {
  const [name, setName] = React.useState<string>('名前')
  const [preName, setPreName] = React.useState<string>('名前')

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>指定された名前を生のHTMLでレンダリングします。</p>
      <Grid columns={2} divided>
        <Grid.Row>
          <Grid.Column>
            <Form.Field>
              <Input
                value={preName}
                style={{ width: '100%' }}
                onChange={(e) => {
                  setPreName(e.target.value)
                }}
                size="large"
              />
              <Button
                onClick={() => {
                  setName(preName)
                }}
              >
                更新する
              </Button>
            </Form.Field>
          </Grid.Column>
          <Grid.Column>
            <Card>
              <Image
                src={`https://avatars.dicebear.com/4.5/api/male/${name}.svg`}
                wrapped
                ui={false}
              />
              <Card.Content>
                <Card.Header
                  dangerouslySetInnerHTML={{ __html: name }}
                ></Card.Header>
                <Card.Meta>
                  <span className="date">Joined in 2020</span>
                </Card.Meta>
                <Card.Description>{"I'm Engineer."}</Card.Description>
              </Card.Content>
              <Card.Content extra>
                <a>
                  <Icon name="user" />
                  22 Friends
                </a>
              </Card.Content>
            </Card>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  )
}

export default NoOpener
