import React from 'react';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function BuyButtonNavbarItem() {
  const { siteConfig } = useDocusaurusContext();
  const url = siteConfig?.customFields?.buyButtonUrl ?? 'https://buy.immich.app';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline hover:no-underline"
    >
      <button className="buy-button bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-black rounded-xl">
        <Translate id="navbar.buy_immich_button">Buy Immich</Translate>
      </button>
    </a>
  );
}