import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <h1
          className="hero__title"
          style={{
            fontFamily: "Snowburst One",
            color: "#adcbfa",
          }}
        >
          IMMICH
        </h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttonsRow}>
          <div className={styles.buttons}>
            <Link
              className={clsx("button button--lg", styles.introButton)}
              to="docs/overview/introduction"
            >
              Introduction
            </Link>
          </div>

          <div className={styles.buttons}>
            <Link
              className={clsx("button button--lg", styles.installButton)}
              to="docs/installation/requirements"
            >
              Installation
            </Link>
          </div>
        </div>

        <img src="/img/immich-screenshots.png" alt="logo" />
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Home`}
      description="immich Self-hosted photo and video backup solution directly from your mobile phone "
    >
      <HomepageHeader />
      <main>{/* <HomepageFeatures /> */}</main>
    </Layout>
  );
}
