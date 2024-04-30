import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as CSS from 'csstype';
import * as React from 'react';
import { WelcomeEmailProps } from 'src/interfaces/notification.interface';

export const WelcomeEmail = ({ baseUrl, displayName, username, password }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>You have been invited to a new Immich instance.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={section}>
          <Img
            src={`https://immich.app/img/immich-logo-inline-light.png`}
            alt="Immich"
            style={{ width: '100%', alignSelf: 'center', color: 'white' }}
          />
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

          <Button style={button} href={`${baseUrl}/auth/login`}>
            Login
          </Button>

          <Text style={text}>
            Or visit (<Link href={baseUrl}>{baseUrl}</Link>) to login.
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

WelcomeEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app/auth/login',
  displayName: 'Alan Turing',
  username: 'alanturing',
  password: 'mysuperpassword',
} as WelcomeEmailProps;

export default WelcomeEmail;

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

const title = {
  fontSize: '2rem',
  fontWeight: 500,
  lineHeight: '36px',
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

const button: CSS.Properties = {
  backgroundColor: 'rgb(66, 80, 175)',
  margin: '1em 2em',
  padding: '0.75em 3em',
  color: '#fff',
  fontSize: '1em',
  fontWeight: 700,
  lineHeight: 1.5,
  textTransform: 'uppercase',
  borderRadius: '9999px',
  textAlign: 'center',
};

const footer = {
  color: '#6a737d',
  fontSize: '0.8rem',
  textAlign: 'center' as const,
  marginTop: '24px',
};
