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
import { AlbumInviteEmailProps } from 'src/interfaces/notification.interface';

export const AlbumInviteEmail = ({ baseUrl, albumName, guestName, ownerName, albumId }: AlbumInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You have added to a shared album.</Preview>
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

          <Text style={text}>
            Hey <strong>{guestName}</strong>!
          </Text>

          <Text style={text}>
            {ownerName} has invited you to album <strong>{albumName}</strong>.
          </Text>

          <Row>
            <Text style={{ ...text, marginBottom: '36px' }}>
              To view the album, open the link in a browser, or click the button below.
            </Text>
          </Row>
          <Row>
            <Link style={{ marginTop: '50px' }} href={`${baseUrl}/albums/${albumId}`}>
              {baseUrl}/albums/{albumId}
            </Link>
          </Row>
          <Row>
            <Button style={button} href={`${baseUrl}/albums/${albumId}`}>
              View album
            </Button>
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

AlbumInviteEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app',
  albumName: 'Trip to Europe',
  ownerName: 'Owner User',
  guestName: 'Guest User',
  albumId: 'b63f6dae-e1c9-401b-9a85-9dbbf5612539',
} as AlbumInviteEmailProps;

export default AlbumInviteEmail;

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
