import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";

function HomepageHeader() {
  return (
    <header>
      <section className="text-center m-6 p-12 border border-red-400 rounded-[50px] bg-gray-100 dark:bg-immich-dark-gray">
        <h1 className="md:text-6xl font-bold mb-10 font-immich-title text-immich-primary dark:text-immich-dark-primary">
          IMMICH
        </h1>
        <div className="font-thin sm:text-base md:text-2xl my-12 sm:leading-tight">
          <p>SELF-HOSTED BACKUP SOLUTION </p>
          <p>FOR PHOTOS AND VIDEOS</p>
          <p>ON MOBILE DEVICE</p>
        </div>

        <div className="flex place-items-center place-content-center mt-9 mb-16 gap-4 ">
          <Link
            className="flex place-items-center place-content-center py-3 px-8 border bg-immich-primary dark:bg-immich-dark-primary rounded-full no-underline hover:no-underline text-white hover:text-gray-50 dark:text-immich-dark-bg font-bold"
            to="docs/overview/introduction"
          >
            GET STARTED
          </Link>

          <Link
            className="flex place-items-center place-content-center py-3 px-8 border bg-immich-primary/10 dark:bg-gray-300  rounded-full hover:no-underline text-immich-primary dark:text-immich-dark-bg font-bold"
            to="https://demo.immich.app/"
          >
            DEMO PORTAL
          </Link>
        </div>

        <img src="/img/immich-screenshots.webp" alt="logo" />
      </section>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title={`Home`}
      description="immich Self-hosted photo and video backup solution directly from your mobile phone "
      noFooter={true}
    >
      <HomepageHeader />
      <div className="flex flex-col place-items-center place-content-center">
        <p>This project is available under MIT license.</p>
        <p className="text-xs">Privacy should not be a luxury</p>
      </div>
    </Layout>
  );
}
