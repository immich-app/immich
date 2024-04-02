import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as CSS from 'csstype';
import * as React from 'react';

interface WelcomeUserEmailProps {
  displayName: string;
  username: string;
  password?: string;
  url: string;
}

export const WelcomeUserEmail = ({ displayName, username, password, url }: WelcomeUserEmailProps) => (
  <Html>
    <Head />
    <Preview>You have bee invited to a new Immich istance.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logo}>
          <Img src={`https://immich.app//img/immich-logo-inline-light.png`} height="45px" alt="Immich" />
        </Section>

        <Section style={section}>
          <Text style={title}>
            Self-hosted photo and <br />
            video management solution
          </Text>

          <Text style={text}>
            Hey <strong>{displayName}</strong>!
            <br />A new account has been created for you.
          </Text>

          <Text style={text}>
            <strong>Username</strong>: {username}
            {password && (
              <>
                <br />
                <strong>Password</strong>: {password}
              </>
            )}
          </Text>

          <Row style={buttonWrapper}>
            <Column>
              <Button style={button} href={url}>
                First Login
              </Button>
            </Column>
          </Row>

          <Text style={text}>
            Or visit (<Link href={url}>{url}</Link>) for your first login.
          </Text>
        </Section>

        <Hr style={{ color: 'rgb(66, 80, 175)', marginTop: '24px' }} />

        {/* TODO: This needs tailwind support for responsive columns */}
        {/* <Section>
          <Row>
            <Column>
              <Link href="https://play.google.com/store/apps/details?id=app.alextran.immich">
                <Img src={`https://immich.app/img/google-play-badge.png`} height="96px" alt="Immich" />
              </Link>
            </Column>
            <Column>
              <Link href="https://apps.apple.com/sg/app/immich/id1613945652">
                <Img
                  src={`https://immich.app/img/ios-app-store-badge.svg`}
                  alt="Immich"
                  style={{
                    height: '68px',
                    padding: '14px',
                  }}
                />
              </Link>
            </Column>
          </Row>
        </Section> */}

        <Text style={footer}>
          <Link href="https://immich.app">Immich</Link> project is available under GNU AGPL v3 license.
        </Text>
      </Container>
    </Body>
  </Html>
);

WelcomeUserEmail.PreviewProps = {
  displayName: 'Alan Turing',
  url: 'https://demo.immich.app/auth/login',
  username: 'alanturing',
  password: 'mysuperpassword',
} as WelcomeUserEmailProps;

export default WelcomeUserEmail;

const main = {
  backgroundColor: '#ffffff',
  color: 'rgb(66, 80, 175)',
  fontFamily: 'Overpass, sans-serif',
  fontSize: '16px',
  lineHeight: '16px',
};

const container = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logo = {
  padding: '16px 0px',
};

const title = {
  fontSize: '2.25rem',
  fontWeight: 500,
  lineHeight: '40px',
};

const section = {
  padding: '50px',
  backgroundColor: 'rgb(226, 232, 240)',
  border: 'solid 0px rgb(248 113 113)',
  borderRadius: '50px',
  textAlign: 'center' as const,
};

const text = {
  margin: '0 0 10px 0',
  textAlign: 'left' as const,
};

const buttonWrapper = {
  padding: '24px 0',
};

const button: CSS.Properties = {
  backgroundColor: 'rgb(66, 80, 175)',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 700,
  lineHeight: 1.5,
  textTransform: 'uppercase',
  borderRadius: '9999px',
  padding: '12px 32px',
};

const footer = {
  color: '#6a737d',
  fontSize: '0.8rem',
  textAlign: 'center' as const,
  marginTop: '24px',
};
