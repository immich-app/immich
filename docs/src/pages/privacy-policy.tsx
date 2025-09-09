import React from 'react';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';

function HomepageHeader() {
  return (
    <header>
      <section className="max-w-[900px] m-4 p-4 md:p-6 md:m-auto md:my-12 border border-red-400 rounded-2xl bg-slate-200 dark:bg-immich-dark-gray">
        <section>
          <h1>
            <Translate id="privacy.title">Privacy Policy</Translate>
          </h1>
          <p>
            <Translate id="privacy.lastUpdated">Last updated: July 31st 2024</Translate>
          </p>
          <p>
            <Translate id="privacy.intro">
              Welcome to Immich. We are committed to respecting your privacy. This Privacy Policy sets out how we
              collect, use, and share information when you use our Immich app.
            </Translate>
          </p>
        </section>

        {/* 1. Scope */}
        <section>
          <h2>
            <Translate id="privacy.scope.title">1. Scope of This Policy</Translate>
          </h2>
          <p>
            <Translate id="privacy.scope.text">
              This Privacy Policy applies to the Immich app ("we", "our", or "us") and covers our collection, use, and
              disclosure of your information. This Policy does not cover any third-party websites, services, or
              applications that can be accessed through our app, or third-party services you may access through Immich.
            </Translate>
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section>
          <h2>
            <Translate id="privacy.collect.title">2. Information We Collect</Translate>
          </h2>
          <div>
            <p>
              <strong>
                <Translate id="privacy.collect.localData">Locally Stored Data</Translate>
              </strong>
              :{' '}
              <Translate id="privacy.collect.localData.text">
                Immich stores all your photos, albums, and settings locally on your device. We do not have access to
                this data, nor do we transmit or store it on any of our servers.
              </Translate>
            </p>
          </div>

          <div>
            <p>
              <strong>
                <Translate id="privacy.collect.purchase">Purchase Information</Translate>
              </strong>
              :{' '}
              {translate(
                {
                  id: 'privacy.collect.purchase.text',
                  message:
                    'When you make a purchase within the {link}, we collect the following information for tax calculation purposes:',
                },
                {
                  link: (
                    <a href="https://buy.immich.app" target="_blank" rel="noopener noreferrer">
                      https://buy.immich.app
                    </a>
                  ),
                },
              )}
            </p>
            <ul>
              <li>
                <Translate id="privacy.collect.country">Country of origin</Translate>
              </li>
              <li>
                <Translate id="privacy.collect.postal">
                  Postal code (if the user is from Canada or the United States)
                </Translate>
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Use of Your Information */}
        <section>
          <h2>
            <Translate id="privacy.use.title">3. Use of Your Information</Translate>
          </h2>
          <p>
            <strong>
              <Translate id="privacy.use.tax">Tax Calculation:</Translate>
            </strong>{' '}
            <Translate id="privacy.use.text">
              The country of origin and postal code (for users from Canada or the United States) are collected solely
              for determining the applicable tax rates on your purchase.
            </Translate>
          </p>
        </section>

        {/* 4. Sharing */}
        <section>
          <h2>
            <Translate id="privacy.sharing.title">4. Sharing of Your Information</Translate>
          </h2>
          <ul>
            <li>
              <strong>
                <Translate id="privacy.sharing.tax">Tax Authorities:</Translate>
              </strong>{' '}
              <Translate id="privacy.sharing.tax.text">
                The purchase information may be shared with tax authorities as required by law.
              </Translate>
            </li>
            <li>
              <strong>
                <Translate id="privacy.sharing.payment">Payment Providers:</Translate>
              </strong>{' '}
              <Translate id="privacy.sharing.payment.text">
                The purchase information may be shared with payment providers where required.
              </Translate>
            </li>
          </ul>
        </section>

        {/* 5. Changes */}
        <section>
          <h2>
            <Translate id="privacy.changes.title">5. Changes to This Policy</Translate>
          </h2>
          <p>
            <Translate id="privacy.changes.text">
              We may update our Privacy Policy from time to time. If we make any changes, we will notify you by revising
              the "Last updated" date at the top of this policy. It's encouraged that users frequently check this page
              for any changes to stay informed about how we are helping to protect the personal information we collect.
            </Translate>
          </p>
        </section>

        {/* 6. Contact */}
        <section>
          <h2>
            <Translate id="privacy.contact.title">6. Contact Us</Translate>
          </h2>
          <p>
            {translate(
              {
                id: 'privacy.contact.text',
                message: 'If you have any questions about this Privacy Policy, please contact us at {email}',
              },
              {
                email: <a href="mailto:immich@futo.org">immich@futo.org</a>,
              },
            )}
          </p>
        </section>
      </section>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title={translate({ id: 'privacy.title', message: 'Privacy Policy' })}
      description={translate({
        id: 'privacy.description',
        message: 'Immich self-hosted photo and video backup solution directly from your mobile phone',
      })}
      noFooter={true}
    >
      <HomepageHeader />
      <div className="flex flex-col place-items-center place-content-center">
        <p>
          <Translate id="privacy.footer.license">This project is available under GNU AGPL v3 license.</Translate>
        </p>
        <p className="text-xs">
          <Translate id="privacy.footer.slogan">Privacy should not be a luxury</Translate>
        </p>
      </div>
    </Layout>
  );
}
