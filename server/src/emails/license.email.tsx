import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import FutoLayout from 'src/emails/components/futo.layout';

/**
 * Template to be used for FUTOPay project
 * Variable is {{LICENSEKEY}}
 * */
export const LicenseEmail = () => (
  <FutoLayout preview="Your Immich Server License">
    <Text>Thank you for supporting Immich and open-source software</Text>

    <Text>
      Your <strong>Immich</strong> key is
    </Text>

    <Section className="my-2 bg-gray-200 rounded-2xl text-center p-4">
      <Text className="m-0 text-monospace font-bold text-immich-primary">{'{{LICENSEKEY}}'}</Text>
    </Section>

    <Text>
      To activate your instance, you can click the following button or copy and paste the link below to your browser.
    </Text>

    <Section className="flex justify-center my-6">
      <ImmichButton
        href={`https://my.immich.app/link?target=activate_license&licenseKey={{LICENSEKEY}}&activationKey={{ACTIVATIONKEY}}`}
      >
        Activate
      </ImmichButton>
    </Section>

    <Text className="text-center">
      <Link
        className="text-immich-primary text-sm"
        // style={{ marginTop: '50px', color: 'rgb(66, 80, 175)', fontSize: '0.9rem' }}
        href={`https://my.immich.app/link?target=activate_license&licenseKey={{LICENSEKEY}}&activationKey={{ACTIVATIONKEY}}`}
      >
        https://my.immich.app/link?target=activate_license&licenseKey={'{{LICENSEKEY}}'}&activationKey=
        {'{{ACTIVATIONKEY}}'}
      </Link>
    </Text>
  </FutoLayout>
);

LicenseEmail.PreviewProps = {};

export default LicenseEmail;
