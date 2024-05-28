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
import { AlbumUpdateEmailProps } from 'src/interfaces/notification.interface';

export const AlbumUpdateEmail = ({ baseUrl, albumName, recipientName, albumId, cid }: AlbumUpdateEmailProps) => (
  <Html>
    <Head />
    <Preview>New media has been added to a shared album.</Preview>
    <Body
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#ffffff',
        color: 'rgb(28,28,28)',
        fontFamily: 'Overpass, sans-serif',
        fontSize: '18px',
        lineHeight: '24px',
      }}
    >
      <Container
        style={{
          width: '540px',
          maxWidth: '100%',
          padding: '10px',
          margin: '0 auto',
        }}
      >
        <Section
          style={{
            padding: '36px',
            tableLayout: 'fixed',
            backgroundColor: 'rgb(226, 232, 240)',
            border: 'solid 0px rgb(248 113 113)',
            borderRadius: '50px',
            textAlign: 'center' as const,
          }}
        >
          <Img
            src="https://immich.app/img/immich-logo-inline-light.png"
            alt="Immich"
            style={{
              height: 'auto',
              margin: '0 auto 48px auto',
              width: '50%',
              alignSelf: 'center',
              color: 'white',
            }}
          />

          <Text style={text}>Hey {recipientName}!</Text>

          <Text style={text}>
            New media has been added to <strong>{albumName}</strong>, check it out!
          </Text>

          {cid && (
            <Row>
              <Column align="center">
                <Img
                  src={`cid:${cid}`}
                  width="300"
                  style={{
                    borderRadius: '20px',
                    boxShadow: 'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px',
                  }}
                />
              </Column>
            </Row>
          )}

          <Row style={{ marginBottom: '36px', marginTop: '36px' }}>
            <Text style={{ ...text }}>To view the album, open the link in a browser, or click the button below.</Text>
          </Row>
          <Row>
            <Column align="center">
              <Link style={{ marginTop: '50px' }} href={`${baseUrl}/albums/${albumId}`}>
                {baseUrl}/albums/{albumId}
              </Link>
            </Column>
          </Row>
          <Row>
            <Column align="center">
              <Button style={button} href={`${baseUrl}/albums/${albumId}`}>
                View album
              </Button>
            </Column>
          </Row>
        </Section>

        <Hr style={{ color: 'rgb(66, 80, 175)', marginTop: '24px' }} />

        <Section style={{ textAlign: 'center' }}>
          <Row>
            <Column align="center">
              <Link href="https://play.google.com/store/apps/details?id=app.alextran.immich">
                <Img src={`https://immich.app/img/google-play-badge.png`} height="96px" alt="Immich" />
              </Link>
              <Link href="https://apps.apple.com/sg/app/immich/id1613945652">
                <Img
                  src={`https://immich.app/img/ios-app-store-badge.png`}
                  alt="Immich"
                  style={{ height: '72px', padding: '14px' }}
                />
              </Link>
            </Column>
          </Row>
        </Section>

        <Text
          style={{
            color: '#6a737d',
            fontSize: '0.8rem',
            textAlign: 'center' as const,
            marginTop: '12px',
          }}
        >
          <Link href="https://immich.app">Immich</Link> project is available under GNU AGPL v3 license.
        </Text>
      </Container>
    </Body>
  </Html>
);

AlbumUpdateEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app',
  albumName: 'Trip to Europe',
  albumId: 'b63f6dae-e1c9-401b-9a85-9dbbf5612539',
  recipientName: 'Alex Tran',
} as AlbumUpdateEmailProps;

export default AlbumUpdateEmail;

const text = {
  margin: '0 0 24px 0',
  textAlign: 'left' as const,
  fontSize: '18px',
  lineHeight: '24px',
};

const button: CSS.Properties = {
  backgroundColor: 'rgb(66, 80, 175)',
  margin: '1em 0',
  padding: '0.75em 3em',
  color: '#fff',
  fontSize: '1em',
  fontWeight: 700,
  lineHeight: 1.5,
  textTransform: 'uppercase',
  borderRadius: '9999px',
};
