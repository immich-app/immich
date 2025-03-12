import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
function HomepageHeader() {
  return (
    <header>
      <section className="max-w-[900px] m-4 p-4 md:p-6 md:m-auto md:my-12 border border-red-400 rounded-2xl  bg-slate-200 dark:bg-immich-dark-gray">
        <section>
          <h1>Privacy Policy</h1>
          <p>Last updated: July 31st 2024</p>
          <p>
            Welcome to Immich. We are committed to respecting your privacy. This Privacy Policy sets out how we collect,
            use, and share information when you use our Immich app.
          </p>
        </section>

        {/* 1. Scope of This Policy */}
        <section>
          <h2>1. Scope of This Policy</h2>
          <p>
            This Privacy Policy applies to the Immich app ("we", "our", or "us") and covers our collection, use, and
            disclosure of your information. This Policy does not cover any third-party websites, services, or
            applications that can be accessed through our app, or third-party services you may access through Immich.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section>
          <h2>2. Information We Collect</h2>
          <div>
            <p>
              <strong>Locally Stored Data</strong>: Immich stores all your photos, albums, settings, and locally on your
              device. We do not have access to this data, nor do we transmit or store it on any of our servers.
            </p>
          </div>

          <div>
            <p>
              <strong>Purchase Information:</strong> When you make a purchase within the{' '}
              <a href="https://buy.immich.app">https://buy.immich.app</a>, we collect the following information for tax
              calculation purposes:
            </p>
            <ul>
              <li>Country of origin</li>
              <li>Postal code (if the user is from Canada or the United States)</li>
            </ul>
          </div>
        </section>

        {/* 3. Use of Your Information */}
        <section>
          <h2>3. Use of Your Information</h2>
          <p>
            <strong>Tax Calculation:</strong> The country of origin and postal code (for users from Canada or the United
            States) are collected solely for determining the applicable tax rates on your purchase.
          </p>
        </section>

        {/* 4. Sharing of Your Information */}
        <section>
          <h2>4. Sharing of Your Information</h2>
          <ul>
            <li>
              <strong>Tax Authorities:</strong> The purchase information may be shared with tax authorities as required
              by law.
            </li>
            <li>
              <strong>Payment Providers:</strong> The purchase information may be shared with payment providers where
              required.
            </li>
          </ul>
        </section>

        {/* 5. Changes to This Policy */}
        <section>
          <h2>5. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. If we make any changes, we will notify you by revising
            the "Last updated" date at the top of this policy. It's encouraged that users frequently check this page for
            any changes to stay informed about how we are helping to protect the personal information we collect.
          </p>
        </section>

        {/* 6. Contact Us */}
        <section>
          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:immich@futo.org">immich@futo.org</a>
          </p>
        </section>
      </section>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Home"
      description="immich Self-hosted photo and video backup solution directly from your mobile phone "
      noFooter={true}
    >
      <HomepageHeader />
      <div className="flex flex-col place-items-center place-content-center">
        <p>This project is available under GNU AGPL v3 license.</p>
        <p className="text-xs">Privacy should not be a luxury</p>
      </div>
    </Layout>
  );
}
