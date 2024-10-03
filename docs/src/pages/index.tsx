import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { useColorMode } from '@docusaurus/theme-common';
import { discordPath } from '@site/src/components/svg-paths';
import Icon from '@mdi/react';
function HomepageHeader() {
  const { isDarkTheme } = useColorMode();

  return (
    <header>
      <div className="top-[calc(12%)]  md:top-[calc(30%)] h-screen w-full absolute -z-10">
        <img src={'img/immich-logo.svg'} className="h-[110%] w-[110%] mb-2 antialiased -z-10" alt="Immich logo" />
        <div className="w-full h-[120vh] absolute left-0 top-0 backdrop-blur-3xl bg-immich-bg/40 dark:bg-transparent"></div>
      </div>
      <section className="text-center pt-12 sm:pt-24 bg-immich-bg/50 dark:bg-immich-dark-bg/80">
        <img
          src={isDarkTheme ? 'img/logomark-dark.svg' : 'img/logomark-light.svg'}
          className="h-[115px] w-[115px] mb-2 antialiased rounded-none"
          alt="Immich logo"
        />
        <div className="mt-8">
          <p className="text-3xl md:text-5xl sm:leading-tight mb-1 font-extrabold text-black/90 dark:text-white px-4">
            Self-hosted{' '}
            <span className="text-immich-primary dark:text-immich-dark-primary">
              photo and <span className="block"></span>
              video management{' '}
            </span>
            solution<span className="block"></span>
          </p>

          <p className="max-w-1/4 m-auto mt-4 px-4">
            Easily back up, organize, and manage your photos on your own server. Immich helps you
            <span className="sm:block"></span> browse, search and organize your photos and videos with ease, without
            sacrificing your privacy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row place-items-center place-content-center mt-9 gap-4 ">
          <Link
            className="flex place-items-center place-content-center py-3 px-8 border bg-immich-primary dark:bg-immich-dark-primary rounded-xl no-underline hover:no-underline text-white hover:text-gray-50 dark:text-immich-dark-bg font-bold uppercase"
            to="docs/overview/introduction"
          >
            Get started
          </Link>

          <Link
            className="flex place-items-center place-content-center py-3 px-8 border bg-immich-primary/10 dark:bg-gray-300  rounded-xl hover:no-underline text-immich-primary dark:text-immich-dark-bg font-bold uppercase"
            to="https://demo.immich.app/"
          >
            Demo
          </Link>
        </div>

        <div className="my-12 flex gap-1 font-medium place-items-center place-content-center text-immich-primary dark:text-immich-dark-primary">
          <Icon path={discordPath} size={1} />
          <Link to="https://discord.immich.app/">Join our Discord</Link>
        </div>
        <img
          src={isDarkTheme ? '/img/screenshot-dark.webp' : '/img/screenshot-light.webp'}
          alt="screenshots"
          className="w-[95%] lg:w-[85%] xl:w-[70%] 2xl:w-[60%] "
        />

        <div className="mx-[25%] m-auto my-14 md:my-28">
          <hr className="border bg-gray-500 dark:bg-gray-400" />
        </div>

        <img
          src={isDarkTheme ? 'img/logomark-dark.svg' : 'img/logomark-light.svg'}
          className="h-[115px] w-[115px] mb-2 antialiased rounded-none"
          alt="Immich logo"
        />

        <div>
          <p className="font-bold text-2xl md:text-5xl ">Download mobile app</p>
          <p className="text-lg">
            Download Immich app and start backing up your photos and videos securely to your own server
          </p>
        </div>
        <div className="flex flex-col sm:flex-row place-items-center place-content-center mt-4 gap-1">
          <div className="h-24">
            <a href="https://play.google.com/store/apps/details?id=app.alextran.immich">
              <img className="h-24" alt="Get it on Google Play" src="/img/google-play-badge.png" />
            </a>
          </div>
          <div className="h-24">
            <a href="https://apps.apple.com/sg/app/immich/id1613945652">
              <img className="h-24 sm:p-3.5 p-3" alt="Download on the App Store" src="/img/ios-app-store-badge.svg" />
            </a>
          </div>
        </div>

        <img
          src={isDarkTheme ? '/img/app-qr-code-dark.svg' : '/img/app-qr-code-light.svg'}
          alt="app qr code"
          width={'150px'}
          className="shadow-lg p-3 my-8 dark:bg-immich-dark-bg "
        />
      </section>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout title="Home" description="Self-hosted photo and video management solution" noFooter={true}>
      <HomepageHeader />
      <div className="flex flex-col place-items-center text-center place-content-center dark:bg-immich-dark-bg py-8">
        <p>This project is available under GNU AGPL v3 license.</p>
        <p className="text-xs">Privacy should not be a luxury</p>
      </div>
    </Layout>
  );
}
