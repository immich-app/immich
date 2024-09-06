import { Img, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import ImmichLayout from 'src/emails/components/immich.layout';
import { AlbumInviteEmailProps } from 'src/interfaces/notification.interface';

export const AlbumInviteEmail = ({
  baseUrl,
  albumName,
  recipientName,
  senderName,
  albumId,
  cid,
}: AlbumInviteEmailProps) => (
  <ImmichLayout preview="You have been added to a shared album.">
    <Text className="m-0">
      Hey <strong>{recipientName}</strong>!
    </Text>

    <Text>
      {senderName} has added you to the album <strong>{albumName}</strong>.
    </Text>

    {cid && (
      <Section className="flex justify-center my-0">
        <Img
          className="max-w-[300px] w-full rounded-lg"
          src={`cid:${cid}`}
          style={{
            boxShadow: 'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px',
          }}
        />
      </Section>
    )}

    <Section className="flex justify-center my-6">
      <ImmichButton href={`${baseUrl}/albums/${albumId}`}>View Album</ImmichButton>
    </Section>

    <Text className="text-xs">
      If you cannot click the button use the link below to view the album.
      <br />
      <Link href={`${baseUrl}/albums/${albumId}`}>{`${baseUrl}/albums/${albumId}`}</Link>
    </Text>
  </ImmichLayout>
);

AlbumInviteEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app',
  albumName: 'Trip to Europe',
  albumId: 'b63f6dae-e1c9-401b-9a85-9dbbf5612539',
  senderName: 'Owner User',
  recipientName: 'Alan Turing',
} as AlbumInviteEmailProps;

export default AlbumInviteEmail;
