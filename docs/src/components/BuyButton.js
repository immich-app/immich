import React from 'react';
import Translate from '@docusaurus/Translate';

export default function BuyButton() {
  return (
    <a
      href="https://buy.immich.app"
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