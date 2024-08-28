import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import ImmichLayout from 'src/emails/components/immich.layout';
import { WelcomeEmailProps } from 'src/interfaces/notification.interface';

export const WelcomeEmail = ({ baseUrl, displayName, username, password }: WelcomeEmailProps) => (
  <ImmichLayout preview="You have been invited to a new Immich instance.">
    <Text className="m-0">
      Hey <strong>{displayName}</strong>!
    </Text>

    <Text>A new account has been created for you.</Text>

    <Text>
      <strong>Username</strong>: {username}
      {password && (
        <>
          <br />
          <strong>Password</strong>: {password}
        </>
      )}
    </Text>

    <Section className="flex justify-center my-6">
      <ImmichButton href={`${baseUrl}/auth/login`}>Login</ImmichButton>
    </Section>

    <Text className="text-xs">
      If you cannot click the button use the link below to proceed with first login.
      <br />
      <Link href={baseUrl}>{baseUrl}</Link>
    </Text>
  </ImmichLayout>
);

WelcomeEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app/auth/login',
  displayName: 'Alan Turing',
  username: 'alanturing@immich.app',
  password: 'mysuperpassword',
} as WelcomeEmailProps;

export default WelcomeEmail;
