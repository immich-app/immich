import Link from '@docusaurus/Link';
import React from 'react';
import Translate from '@docusaurus/Translate';

interface CommunityGuidesProps {
  title: JSX.Element;
  description: JSX.Element;
  url: string;
}

const guides: CommunityGuidesProps[] = [
  {
    title: <Translate>Cloudflare Tunnels with SSO/OAuth</Translate>,
    description: <Translate>Setting up Cloudflare Tunnels and a SaaS App for Immich.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/8299',
  },
  {
    title: <Translate>Database backup in TrueNAS</Translate>,
    description: <Translate>Create a database backup with pgAdmin in TrueNAS.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/8809',
  },
  {
    title: <Translate>Unraid backup scripts</Translate>,
    description: <Translate>Back up your assets in Unraid with a pre-prepared script.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/8416',
  },
  {
    title: <Translate>Sync folders with albums</Translate>,
    description: <Translate>synchronize folders in imported library with albums having the folders name.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/3382',
  },
  {
    title: <Translate>Podman/Quadlets Install</Translate>,
    description: <Translate>Documentation for simple podman setup using quadlets.</Translate>,
    url: 'https://github.com/tbelway/immich-podman-quadlets/blob/main/docs/install/podman-quadlet.md',
  },
  {
    title: <Translate>Google Photos import + albums</Translate>,
    description: <Translate>Import your Google Photos files into Immich and add your albums.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/1340',
  },
  {
    title: <Translate>Access Immich with custom domain</Translate>,
    description: <Translate>Access your local Immich installation over the internet using your own domain.</Translate>,
    url: 'https://github.com/ppr88/immich-guides/blob/main/open-immich-custom-domain.md',
  },
  {
    title: <Translate>Nginx caching map server</Translate>,
    description: <Translate>Increase privacy by using nginx as a caching proxy in front of a map tile server.</Translate>,
    url: 'https://github.com/pcouy/pcouy.github.io/blob/main/_posts/2024-08-30-proxying-a-map-tile-server-for-increased-privacy.md',
  },
  {
    title: <Translate>fail2ban setup instructions</Translate>,
    description: <Translate>How to configure an existing fail2ban installation to block incorrect login attempts.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/3243#discussioncomment-6681948',
  },
  {
    title: <Translate>Immich remote access with NordVPN Meshnet</Translate>,
    description: <Translate>Access Immich with an end-to-end encrypted connection.</Translate>,
    url: 'https://meshnet.nordvpn.com/how-to/remote-files-media-access/immich-remote-access',
  },
  {
    title: <Translate>Trust Self Signed Certificates with Immich - OAuth Setup</Translate>,
    description: <Translate>Set up Certificate Authority trust with Immich, and your private OAuth2/OpenID service, while using a private CA for HTTPS communication.</Translate>,
    url: 'https://github.com/immich-app/immich/discussions/18614',
  },
];

function CommunityGuide({ title, description, url }: CommunityGuidesProps): JSX.Element {
  return (
    <section className="flex flex-col gap-4 justify-between dark:bg-immich-dark-gray bg-immich-gray dark:border-0 border-gray-200 border border-solid rounded-2xl px-4 py-6">
      <div className="flex flex-col gap-2">
        <p className="m-0 items-start flex gap-2 text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">
          {title}
        </p>
        <p className="m-0 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        <p className="m-0 text-sm text-gray-600 dark:text-gray-300 my-4">
          <a href={url}>{url}</a>
        </p>
      </div>
      <div className="flex">
        <Link
          className="px-4 py-2 bg-immich-primary/10 dark:bg-gray-300 rounded-xl text-sm hover:no-underline text-immich-primary dark:text-immich-dark-bg font-semibold"
          to={url}
        >
          <Translate>View Guide</Translate>
        </Link>
      </div>
    </section>
  );
}

export default function CommunityGuides(): JSX.Element {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {guides.map((guide, idx) => (
        <CommunityGuide key={idx} {...guide} />
      ))}
    </div>
  );
}