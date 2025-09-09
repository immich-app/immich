import Link from '@docusaurus/Link';
import React from 'react';
import Translate from '@docusaurus/Translate';

interface CommunityProjectProps {
  title: JSX.Element;
  description: JSX.Element;
  url: string;
}

const projects: CommunityProjectProps[] = [
  {
    title: <Translate>immich-go</Translate>,
    description: (
      <Translate>
        An alternative to the immich-CLI that doesn't depend on nodejs. It specializes in importing Google Photos
        Takeout archives.
      </Translate>
    ),
    url: 'https://github.com/simulot/immich-go',
  },
  {
    title: <Translate>ImmichFrame</Translate>,
    description: <Translate>Run an Immich slideshow in a photo frame.</Translate>,
    url: 'https://github.com/3rob3/ImmichFrame',
  },
  {
    title: <Translate>API Album Sync</Translate>,
    description: <Translate>A Python script to sync folders as albums.</Translate>,
    url: 'https://git.orenit.solutions/open/immichalbumpull',
  },
  {
    title: <Translate>Remove offline files</Translate>,
    description: <Translate>A simple way to remove orphaned offline assets from the Immich database</Translate>,
    url: 'https://github.com/Thoroslives/immich_remove_offline_files',
  },
  {
    title: <Translate>Immich-Tools</Translate>,
    description: <Translate>Provides scripts for handling problems on the repair page.</Translate>,
    url: 'https://github.com/clumsyCoder00/Immich-Tools',
  },
  {
    title: <Translate>Lightroom Publisher: mi.Immich.Publisher</Translate>,
    description: <Translate>Lightroom plugin to publish photos from Lightroom collections to Immich albums.</Translate>,
    url: 'https://github.com/midzelis/mi.Immich.Publisher',
  },
  {
    title: <Translate>Lightroom Immich Plugin: lrc-immich-plugin</Translate>,
    description: (
      <Translate>
        Lightroom plugin to publish, export photos from Lightroom to Immich. Import from Immich to Lightroom is also
        supported.
      </Translate>
    ),
    url: 'https://blog.fokuspunk.de/lrc-immich-plugin/',
  },
  {
    title: <Translate>Immich-Tiktok-Remover</Translate>,
    description: <Translate>Script to search for and remove TikTok videos from your Immich library.</Translate>,
    url: 'https://github.com/mxc2/immich-tiktok-remover',
  },
  {
    title: <Translate>Immich Android TV</Translate>,
    description: <Translate>Unofficial Immich Android TV app.</Translate>,
    url: 'https://github.com/giejay/Immich-Android-TV',
  },
  {
    title: <Translate>Create albums from folders</Translate>,
    description: (
      <Translate>A Python script to create albums based on the folder structure of an external library.</Translate>
    ),
    url: 'https://github.com/Salvoxia/immich-folder-album-creator',
  },
  {
    title: <Translate>Powershell Module PSImmich</Translate>,
    description: <Translate>Powershell Module for the Immich API</Translate>,
    url: 'https://github.com/hanpq/PSImmich',
  },
  {
    title: <Translate>Immich Distribution</Translate>,
    description: (
      <Translate>
        Snap package for easy install and zero-care auto updates of Immich. Self-hosted photo management.
      </Translate>
    ),
    url: 'https://immich-distribution.nsg.cc',
  },
  {
    title: <Translate>Immich Kiosk</Translate>,
    description: <Translate>Lightweight slideshow to run on kiosk devices and browsers.</Translate>,
    url: 'https://github.com/damongolding/immich-kiosk',
  },
  {
    title: <Translate>Immich Power Tools</Translate>,
    description: <Translate>Power tools for organizing your Immich library.</Translate>,
    url: 'https://github.com/varun-raj/immich-power-tools',
  },
  {
    title: <Translate>Immich Public Proxy</Translate>,
    description: (
      <Translate>
        Share your Immich photos and albums in a safe way without exposing your Immich instance to the public.
      </Translate>
    ),
    url: 'https://github.com/alangrainger/immich-public-proxy',
  },
  {
    title: <Translate>Immich Kodi</Translate>,
    description: <Translate>Unofficial Kodi plugin for Immich.</Translate>,
    url: 'https://github.com/vladd11/immich-kodi',
  },
  {
    title: <Translate>Immich Downloader</Translate>,
    description: <Translate>Downloads a configurable number of random photos based on people or album ID.</Translate>,
    url: 'https://github.com/jon6fingrs/immich-dl',
  },
  {
    title: <Translate>Immich Upload Optimizer</Translate>,
    description: <Translate>Automatically optimize files uploaded to Immich in order to save storage space</Translate>,
    url: 'https://github.com/miguelangel-nubla/immich-upload-optimizer',
  },
  {
    title: <Translate>Immich Machine Learning Load Balancer</Translate>,
    description: (
      <Translate>Speed up your machine learning by load balancing your requests to multiple computers</Translate>
    ),
    url: 'https://github.com/apetersson/immich_ml_balancer',
  },
];

function CommunityProject({ title, description, url }: CommunityProjectProps): JSX.Element {
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
          <Translate>View Link</Translate>
        </Link>
      </div>
    </section>
  );
}

export default function CommunityProjects(): JSX.Element {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {projects.map((project, idx) => (
        <CommunityProject key={idx} {...project} />
      ))}
    </div>
  );
}
