import Link from '@docusaurus/Link';
import React from 'react';

interface CommunityProjectProps {
  title: string;
  description: string;
  url: string;
}

const projects: CommunityProjectProps[] = [
  {
    title: 'immich-go',
    description: `An alternative to the immich-CLI that doesn't depend on nodejs. It specializes in importing Google Photos Takeout archives.`,
    url: 'https://github.com/simulot/immich-go',
  },
  {
    title: 'ImmichFrame',
    description: 'Run an Immich slideshow in a photo frame.',
    url: 'https://github.com/3rob3/ImmichFrame',
  },
  {
    title: 'API Album Sync',
    description: 'A Python script to sync folders as albums.',
    url: 'https://git.orenit.solutions/open/immichalbumpull',
  },
  {
    title: 'Remove offline files',
    description: 'A simple way to remove orphaned offline assets from the Immich database',
    url: 'https://github.com/Thoroslives/immich_remove_offline_files',
  },
  {
    title: 'Immich-Tools',
    description: 'Provides scripts for handling problems on the repair page.',
    url: 'https://github.com/clumsyCoder00/Immich-Tools',
  },
  {
    title: 'Lightroom Publisher: mi.Immich.Publisher',
    description: 'Lightroom plugin to publish photos from Lightroom collections to Immich albums.',
    url: 'https://github.com/midzelis/mi.Immich.Publisher',
  },
  {
    title: 'Lightroom Immich Plugin: lrc-immich-plugin',
    description: 'Another Lightroom plugin to publish or export photos from Lightroom to Immich.',
    url: 'https://github.com/bmachek/lrc-immich-plugin',
  },
  {
    title: 'Immich Duplicate Finder',
    description: 'Webapp that uses machine learning to identify near-duplicate images.',
    url: 'https://github.com/vale46n1/immich_duplicate_finder',
  },
  {
    title: 'Immich-Tiktok-Remover',
    description: 'Script to search for and remove TikTok videos from your Immich library.',
    url: 'https://github.com/mxc2/immich-tiktok-remover',
  },
  {
    title: 'Immich Android TV',
    description: 'Unofficial Immich Android TV app.',
    url: 'https://github.com/giejay/Immich-Android-TV',
  },
  {
    title: 'Create albums from folders',
    description: 'A Python script to create albums based on the folder structure of an external library.',
    url: 'https://github.com/Salvoxia/immich-folder-album-creator',
  },
  {
    title: 'Powershell Module PSImmich',
    description: 'Powershell Module for the Immich API',
    url: 'https://github.com/hanpq/PSImmich',
  },
  {
    title: 'Immich Distribution',
    description: 'Snap package for easy install and zero-care auto updates of Immich. Self-hosted photo management.',
    url: 'https://immich-distribution.nsg.cc',
  },
  {
    title: 'Immich Kiosk',
    description: 'Lightweight slideshow to run on kiosk devices and browsers.',
    url: 'https://github.com/damongolding/immich-kiosk',
  },
  {
    title: 'Immich Power Tools',
    description: 'Power tools for organizing your immich library.',
    url: 'https://github.com/varun-raj/immich-power-tools',
  },
];

function CommunityProject({ title, description, url }: CommunityProjectProps): JSX.Element {
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
          View Link
        </Link>
      </div>
    </section>
  );
}

export default function CommunityProjects(): JSX.Element {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {projects.map((project) => (
        <CommunityProject {...project} />
      ))}
    </div>
  );
}
