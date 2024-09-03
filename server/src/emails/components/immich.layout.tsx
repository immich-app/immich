import { Body, Container, Font, Head, Hr, Html, Img, Preview, Section, Tailwind, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichFooter } from 'src/emails/components/footer.template';

interface ImmichLayoutProps {
  children: React.ReactNode;
  preview: string;
}

export const ImmichLayout = ({ children, preview }: ImmichLayoutProps) => (
  <Html>
    <Tailwind
      config={{
        // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
        presets: [require('tailwindcss-preset-email')],
        theme: {
          extend: {
            colors: {
              // Light Theme
              'immich-primary': '#4250AF',
              'immich-bg': 'white',
              'immich-fg': 'black',
              'immich-gray': '#F6F6F4',
              'immich-footer': '#6A737D',
            },
            fontFamily: {
              sans: ['Overpass', 'sans-serif'],
              mono: ['Overpass Mono', 'monospace'],
            },
          },
        },
      }}
    >
      <Head>
        <Font
          fontFamily="Overpass"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/overpass/v13/qFdH35WCmI96Ajtm81GrU9vyww.woff2',
            format: 'woff2',
          }}
          fontWeight={'100 900'}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body className="bg-[#F4F4f4] my-auto mx-auto px-2 font-sans text-base text-gray-800">
        <Container className="my-[40px] mx-auto max-w-[465px]">
          <Section className="my-6 p-12 border border-red-400 rounded-[50px] bg-gray-50">
            <Section className="flex justify-center mb-12">
              <Img
                src="https://immich.app/img/immich-logo-inline-light.png"
                className="h-12 antialiased rounded-none"
                alt="Immich"
              />
            </Section>

            {children}
          </Section>

          <Hr className="my-2 text-immich-gray" />

          <ImmichFooter />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

ImmichLayout.PreviewProps = {
  preview: 'This is the preview shown on some mail clients',
  children: <Text>Email body goes here.</Text>,
} as ImmichLayoutProps;

export default ImmichLayout;
