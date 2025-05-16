import { useWindowSize } from '@docusaurus/theme-common';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useEffect, useState } from 'react';

export default function VersionSwitcher(): JSX.Element {
  const [versions, setVersions] = useState([]);
  const [activeLabel, setLabel] = useState('Versions');

  const windowSize = useWindowSize();

  useEffect(() => {
    async function getVersions() {
      try {
        let baseUrl = 'https://immich.app';
        if (window.location.origin === 'http://localhost:3005') {
          baseUrl = window.location.origin;
        }

        const response = await fetch(`${baseUrl}/archived-versions.json`);

        const archiveVersions = await response.json();

        const allVersions = [
          { label: 'Next', url: 'https://main.preview.immich.app' },
          { label: 'Latest', url: 'https://immich.app' },
          ...archiveVersions,
        ].map(({ label, url }) => ({
          label,
          url: new URL(url),
        }));
        setVersions(allVersions);

        const activeVersion = allVersions.find((version) => version.url.origin === window.location.origin);
        if (activeVersion) {
          setLabel(activeVersion.label);
        }
      } catch (error) {
        console.error('Failed to fetch versions', error);
      }
    }

    if (versions.length === 0) {
      getVersions();
    }
  }, []);

  return (
    versions.length > 0 && (
      <DropdownNavbarItem
        className="version-switcher-34ab39"
        label={activeLabel}
        mobile={windowSize === 'mobile'}
        items={versions.map(({ label, url }) => ({
          label,
          to: new URL(location.pathname + location.search + location.hash, url).href,
          target: '_self',
          className: label === activeLabel ? 'dropdown__link--active menu__link--active' : '', // workaround because React Router `<NavLink>` only supports using URL path for checking if active: https://v5.reactrouter.com/web/api/NavLink/isactive-func
        }))}
      />
    )
  );
}
