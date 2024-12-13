import { useWindowSize } from '@docusaurus/theme-common';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useEffect, useState } from 'react';

export default function VersionSwitcher(): JSX.Element {
  const [versions, setVersions] = useState([]);
  const [label, setLabel] = useState('Versions');

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
        ];
        setVersions(allVersions);

        const activeVersion = allVersions.find((version) => new URL(version.url).origin === window.location.origin);
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
        className="navbar__item"
        label={label}
        mobile={windowSize === 'mobile'}
        items={versions.map(({ label, url }) => ({
          label,
          to: url,
          target: '_self',
        }))}
      />
    )
  );
}
