import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import ImmichLayout from 'src/emails/components/immich.layout';
import { WelcomeEmailProps } from 'src/repositories/email.repository';
import { replaceTemplateTags } from 'src/utils/replace-template-tags';

export const WelcomeEmail = ({ baseUrl, displayName, username, customTemplate }: WelcomeEmailProps) => {
  const usableTemplateVariables = {
    displayName,
    username,
    baseUrl,
  };

  const emailContent = customTemplate ? (
    replaceTemplateTags(customTemplate, usableTemplateVariables)
  ) : (
    <>
      <Text className="m-0">
        Hey <strong>{displayName}</strong>!
      </Text>

      <Text>You have been invited to join a PixelUnion.</Text>

      <Text>
        Visit the link below to create your account and start uploading your photos and videos.
      </Text>
    </>
  );

  return (
    <ImmichLayout
      preview={customTemplate ? emailContent.toString() : 'You have been invited to join a PixelUnion.'}
    >
      {customTemplate && (
        <Text className="m-0">
          <div dangerouslySetInnerHTML={{ __html: emailContent }}></div>
        </Text>
      )}

      {!customTemplate && emailContent}

      <Section className="flex justify-center my-6">
        <ImmichButton href={`${baseUrl}/auth/login`}>Create Account</ImmichButton>
      </Section>

      <Text className="text-xs">
        If you cannot click the button, use the link below to create your account.
        <br />
        <Link href={baseUrl}>{baseUrl}</Link>
      </Text>
    </ImmichLayout>
  );
};

WelcomeEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app',
  displayName: 'Alan Turing',
  username: 'alanturing@immich.app',
} as WelcomeEmailProps;

export default WelcomeEmail;
