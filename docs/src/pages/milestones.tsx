import {
  mdiAccountGroup,
  mdiAndroid,
  mdiAppleIos,
  mdiArchiveOutline,
  mdiBookSearchOutline,
  mdiCheckAll,
  mdiCheckboxMarked,
  mdiCollage,
  mdiDevices,
  mdiFaceMan,
  mdiFaceManOutline,
  mdiFile,
  mdiFileSearch,
  mdiFolder,
  mdiHeart,
  mdiImage,
  mdiImageAlbum,
  mdiImageMultipleOutline,
  mdiImageSearch,
  mdiKeyboardSettingsOutline,
  mdiMagnify,
  mdiMap,
  mdiMaterialDesign,
  mdiMerge,
  mdiMonitor,
  mdiMotionPlayOutline,
  mdiPanVertical,
  mdiPartyPopper,
  mdiRaw,
  mdiRotate360,
  mdiSecurity,
  mdiServer,
  mdiShareAll,
  mdiShareCircle,
  mdiStar,
  mdiTag,
  mdiText,
  mdiThemeLightDark,
  mdiTrashCanOutline,
  mdiVideo,
  mdiWeb,
} from '@mdi/js';
import Layout from '@theme/Layout';
import React from 'react';
import Timeline from '../components/timeline';

interface Item {
  icon: string;
  title: string;
  description?: string;
  release: string;
}

const items: Item[] = [
  {
    icon: mdiTrashCanOutline,
    title: 'Trash Feature',
    description: 'Trash, restore from trash, and automatically empty the recycle bin after 30 days.',
    release: 'v1.82.0',
  },
  {
    icon: mdiBookSearchOutline,
    title: 'External Libraries',
    description: 'Automatically import media into Immich based on imports paths and ignore patterns.',
    release: 'v1.79.0',
  },
  {
    icon: mdiMap,
    title: 'Map View (Mobile)',
    description: 'Heat map implementation in the mobile app.',
    release: 'v1.76.0',
  },
  {
    icon: mdiFile,
    title: 'Configuration File',
    description: 'Auto-configure an Immich installation via a configuration file.',
    release: 'v1.75.0',
  },
  {
    icon: mdiMonitor,
    title: 'Slideshow Mode (Web)',
    description: 'Start a full-screen slideshow from an Album on the web.',
    release: 'v1.75.0',
  },
  {
    icon: mdiServer,
    title: 'Hardware Transcoding',
    description: 'Support hardware acceleration (QuickSync, VAAPI, and Nvidia) for video transcoding.',
    release: 'v1.72.0',
  },
  {
    icon: mdiImageAlbum,
    title: 'View Albums via Time Buckets',
    description: 'Upgrade albums to use time buckets, an optimized virtual viewport.',
    release: 'v1.72.0',
  },
  {
    icon: mdiImageAlbum,
    title: 'Album Description',
    description: 'Save an album description.',
    release: 'v1.72.0',
  },
  {
    icon: mdiRotate360,
    title: '360° Photos (Web)',
    description: 'View 360° Photos on the web.',
    release: 'v1.71.0',
  },
  {
    icon: mdiMotionPlayOutline,
    title: 'Android Motion Photos',
    description: 'Add support for Android Motion Photos.',
    release: 'v1.69.0',
  },
  {
    icon: mdiFaceManOutline,
    title: 'Show/Hide Faces',
    description: 'Add the options to show or hide faces.',
    release: 'v1.68.0',
  },
  {
    icon: mdiMerge,
    title: 'Merge Faces',
    description: 'Add the ability to merge multiple faces together.',
    release: 'v1.67.0',
  },
  {
    icon: mdiImage,
    title: 'Feature Photo',
    description: 'Add the option to change the feature photo for a person.',
    release: 'v1.66.0',
  },
  {
    icon: mdiKeyboardSettingsOutline,
    title: 'Multi-Select via SHIFT',
    description: 'Add the option to multi-select while holding SHIFT.',
    release: 'v1.66.0',
  },
  {
    icon: mdiImageMultipleOutline,
    title: 'Memories (Mobile)',
    description: 'View "On this day..." memories in the mobile app.',
    release: 'v1.xx.0',
  },
  {
    icon: mdiFaceMan,
    title: 'Facial Recognition (Mobile)',
    description: 'View detected faces in the mobile app.',
    release: 'v1.63.0',
  },
  {
    icon: mdiImageMultipleOutline,
    title: 'Memories (Web)',
    description: 'View pictures taken in past years on this day on the web.',
    release: 'v1.61.0',
  },
  {
    icon: mdiCollage,
    title: 'Justified Layout (Web)',
    description: 'Implement justified layout (collage) on the web.',
    release: 'v1.61.0',
  },
  {
    icon: mdiRaw,
    title: 'RAW File Formats',
    description: 'Support for RAW file formats.',
    release: 'v1.61.0',
  },
  {
    icon: mdiShareAll,
    title: 'Partner Sharing (Mobile)',
    description: 'View shared partner photos in the mobile app.',
    release: 'v1.58.0',
  },
  {
    icon: mdiFile,
    title: 'XMP Sidecar',
    description: 'Attach XMP Sidecar files to assets.',
    release: 'v1.58.0',
  },
  {
    icon: mdiFolder,
    title: 'Custom Storage Label',
    description: 'Replace the user UUID in the storage template with a custom label.',
    release: 'v1.57.0',
  },
  {
    icon: mdiShareCircle,
    title: 'Partner Sharing',
    description: 'Share your entire collection with another user.',
    release: 'v1.56.0',
  },
  {
    icon: mdiFaceMan,
    title: 'Facial Recognition',
    description: 'Detect faces in pictures and cluster them together as people, which can be named.',
    release: 'v1.56.0',
  },
  {
    icon: mdiMap,
    title: 'Map View (Web)',
    description: 'View a global map, with clusters of photos based on corresponding GPS data.',
    release: 'v1.55.0',
  },
  {
    icon: mdiDevices,
    title: 'Manage Auth Devices',
    description: 'Manage logged-in devices and revoke access from User Settings.',
    release: 'v1.55.0',
  },
  {
    icon: mdiStar,
    description: 'Reach 10K Starts on GitHub!',
    title: '10,000 Stars',
    release: 'v1.54.0',
  },
  {
    icon: mdiText,
    title: 'Asset Descriptions',
    description: 'Save an asset description',
    release: 'v1.54.0',
  },
  {
    icon: mdiArchiveOutline,
    title: 'Archiving',
    description: 'Remove assets from the main timeline by archiving them.',
    release: 'v1.54.0',
  },
  {
    icon: mdiDevices,
    title: 'Responsive Web App',
    description: 'Optimize the web app for small screen.',
    release: 'v1.54.0',
  },
  {
    icon: mdiFileSearch,
    title: 'Search By Metadata',
    description: 'Search images by filename, description, tagged people, make, model, and other metadata.',
    release: 'v1.52.0',
  },
  {
    icon: mdiImageSearch,
    title: 'CLIP Search',
    description: 'Search images with free-form text like "Sunset at the beach".',
    release: 'v1.51.0',
  },
  {
    icon: mdiMagnify,
    title: 'Explore Page',
    description: 'View tagged places, object, and people.',
    release: 'v1.51.0',
  },
  {
    icon: mdiAppleIos,
    title: 'iOS Background Uploads',
    description: 'Automatically backup pictures in the background on iOS.',
    release: 'v1.48.0',
  },
  {
    icon: mdiMotionPlayOutline,
    title: 'Auto-Link Live Photos',
    description: 'Automatically link live photos, even when uploaded as separate files.',
    release: 'v1.48.0',
  },
  {
    icon: mdiMaterialDesign,
    title: 'Material Design 3 (Mobile)',
    description: 'Upgrade the mobile app to Material Design 3.',
    release: 'v1.47.0',
  },
  {
    icon: mdiHeart,
    title: 'Favorites (Mobile)',
    description: 'Show favorites on the mobile app.',
    release: 'v1.46.0',
  },
  {
    icon: mdiPartyPopper,
    title: 'Immich Turns 1',
    description: 'Immich is officially one year old.',
    release: 'v1.43.0',
  },
  {
    icon: mdiHeart,
    title: 'Favorites Page (Web)',
    description: 'Favorite and view favorites on the web.',
    release: 'v1.43.0',
  },
  {
    icon: mdiShareCircle,
    title: 'Public Share Links',
    description: 'Share photos and albums publicly via a shared link.',
    release: 'v1.41.0',
  },
  {
    icon: mdiFolder,
    title: 'User-Defined Storage Structure',
    description: 'Support custom storage structures.',
    release: 'v1.39.0',
  },
  {
    icon: mdiMotionPlayOutline,
    title: 'iOS Live Photos',
    description: 'Backup and display iOS Live Photos.',
    release: 'v1.36.0',
  },
  {
    icon: mdiSecurity,
    title: 'OAuth Integration',
    description: 'Support OAuth2 and OIDC capable identity providers.',
    release: 'v1.36.0',
  },
  {
    icon: mdiWeb,
    title: 'Documentation Site',
    description: 'Release an official documentation website.',
    release: 'v1.33.1',
  },
  {
    icon: mdiThemeLightDark,
    title: 'Dark Mode (Web)',
    description: 'Dark mode on the web.',
    release: 'v1.32.0',
  },
  {
    icon: mdiPanVertical,
    title: 'Virtual Scrollbar (Web)',
    description: 'View the main timeline with a virtual scrollbar, allowing to jump to any point in time, instantly.',
    release: 'v1.27.0',
  },
  {
    icon: mdiCheckAll,
    title: 'Checksum Duplication Check',
    description: 'Enforce per user sha1 checksum uniqueness.',
    release: 'v1.27.0',
  },
  {
    icon: mdiAndroid,
    title: 'Android Background Backup',
    description: 'Automatic backup in the background on Android.',
    release: 'v1.24.0',
  },
  {
    icon: mdiAccountGroup,
    title: 'Admin Portal',
    description: 'Manage users and admin settings from the web.',
    release: 'v1.10.0',
  },
  {
    icon: mdiShareCircle,
    title: 'Album Sharing',
    description: 'Share albums with other users.',
    release: 'v1.7.0',
  },
  {
    icon: mdiTag,
    title: 'Image Tagging',
    description: 'Tag images with custom values.',
    release: 'v1.7.0',
  },
  {
    icon: mdiImage,
    title: 'View Exif',
    description: 'View metadata about assets.',
    release: 'v1.3.0',
  },
  {
    icon: mdiCheckboxMarked,
    title: 'Multi Select',
    description: 'Select and execute actions on multiple assets at the same time.',
    release: 'v1.2.0',
  },
  {
    icon: mdiVideo,
    title: 'Video Player',
    description: 'Play videos in the web and on mobile.',
    release: 'v1.2.0',
  },
  {
    icon: mdiPartyPopper,
    title: 'First Commit',
    description: 'First commit on GitHub, Immich is born.',
    release: 'v1.0.0',
  },
];

export default function MilestonePage(): JSX.Element {
  return (
    <Layout title="Milestones" description="History of Immich">
      <section className="my-8">
        <h1 className="md:text-6xl text-center mb-10 text-immich-primary dark:text-immich-dark-primary">
          Major Milestones
        </h1>
        <p className="text-center text-xl">
          A list of project achievements and milestones, <br />
          by release date.
        </p>
        <div className="flex row justify-around mt-8">
          <div className="flex max-w-full ">
            <Timeline items={items} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
