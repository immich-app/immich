import Link from '@docusaurus/Link';
import React from 'react';

interface CommunityGuidesProps {
  title: string;
  description: string;
  url: string;
}

const guides: CommunityGuidesProps[] = [
  {
    title: 'Cloudflare Tunnels with SSO/OAuth',
    description: `Setting up Cloudflare Tunnels and a SaaS App for Immich.`,
    url: 'https://github.com/immich-app/immich/discussions/8299',
  },
  {
    title: 'Database backup in TrueNAS',
    description: `Create a database backup with pgAdmin in TrueNAS.`,
    url: 'https://github.com/immich-app/immich/discussions/8809',
  },
  {
    title: 'Unraid backup scripts',
    description: `Back up your assets in Unraid with a pre-prepared script.`,
    url: 'https://github.com/immich-app/immich/discussions/8416',
  },
  {
    title: 'Sync folders with albums',
    description: `synchronize folders in imported library with albums having the folders name.`,
    url: 'https://github.com/immich-app/immich/discussions/3382',
  },
  {
    title: 'Immich Podman Quadlets Handbook',
    description:
      'A rewrite of the original Immich Docker Compose file using Podman Quadlets, with a set of extra guides in the repository’s wiki.',
    url: 'https://github.com/linux-universe/immich-podman-quadlets/blob/main/README.md',
  },
  {
    title: 'Podman/Quadlets Install',
    description: 'Documentation for simple podman setup using quadlets.',
    url: 'https://github.com/tbelway/immich-podman-quadlets/blob/main/docs/install/podman-quadlet.md',
  },
  {
    title: 'Google Photos import + albums',
    description: 'Import your Google Photos files into Immich and add your albums.',
    url: 'https://github.com/immich-app/immich/discussions/1340',
  },
  {
    title: 'Access Immich with custom domain',
    description: 'Access your local Immich installation over the internet using your own domain.',
    url: 'https://github.com/ppr88/immich-guides/blob/main/open-immich-custom-domain.md',
  },
  {
    title: 'Nginx caching map server',
    description: 'Increase privacy by using nginx as a caching proxy in front of a map tile server.',
    url: 'https://github.com/pcouy/pcouy.github.io/blob/main/_posts/2024-08-30-proxying-a-map-tile-server-for-increased-privacy.md',
  },
  {
    title: 'fail2ban setup instructions',
    description: 'How to configure an existing fail2ban installation to block incorrect login attempts.',
    url: 'https://github.com/immich-app/immich/discussions/3243#discussioncomment-6681948',
  },
  {
    title: 'Immich remote access with NordVPN Meshnet',
    description: 'Access Immich with an end-to-end encrypted connection.',
    url: 'https://meshnet.nordvpn.com/how-to/remote-files-media-access/immich-remote-access',
  },
  {
    title: 'Trust Self Signed Certificates with Immich - OAuth Setup',
    description:
      'Set up Certificate Authority trust with Immich, and your private OAuth2/OpenID service, while using a private CA for HTTPS commication.',
    url: 'https://github.com/immich-app/immich/discussions/18614',
  },
];

function CommunityGuide({ title, description, url }: CommunityGuidesProps): JSX.Element {
  return (
    <section className="flex flex-col gap-4 justify-between dark:bg-immich-dark-gray bg-immich-gray dark:border-0 border-gray-200 border border-solid rounded-2xl px-4 py-6">
      <div className="flex flex-col gap-2">
        <p className="m-0 items-start flex gap-2 text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">
          <span>{title}</span>
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
          View Guide
        </Link>
      </div>
    </section>
  );
}

export default function CommunityGuides(): JSX.Element {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {guides.map((guides) => (
        <CommunityGuide {...guides} />
      ))}
    </div>
  );
}
