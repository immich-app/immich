import { mdiCalendarToday, mdiLeadPencil, mdiLockOutline, mdiSpeedometerSlow, mdiWeb } from '@mdi/js';
import Layout from '@theme/Layout';
import React from 'react';
import { Item as TimelineItem, Timeline } from '../components/timeline';

const withLanguage = (date: Date) => (language: string) => date.toLocaleDateString(language);

type Item = Omit<TimelineItem, 'done' | 'getDateLabel'> & { date: Date };

const items: Item[] = [
  {
    icon: mdiLeadPencil,
    iconColor: 'gold',
    title: 'PostgreSQL NOTIFY is cursed',
    description:
      'PostgreSQL does everything in a transaction, including NOTIFY. This means using the socket.io postgres-adapter writes to WAL every 5 seconds.',
    link: { url: 'https://github.com/immich-app/immich/pull/10801', text: '#10801' },
    date: new Date(2024, 6, 3),
  },
  {
    icon: mdiWeb,
    iconColor: 'lightskyblue',
    title: 'npm scripts are cursed',
    description:
      'npm scripts make a http call to the npm registry each time they run, which means they are a terrible way to execute a health check.',
    link: { url: 'https://github.com/immich-app/immich/issues/10796', text: '#10796' },
    date: new Date(2024, 6, 3),
  },
  {
    icon: mdiSpeedometerSlow,
    iconColor: 'brown',
    title: '50 extra packages are cursed',
    description:
      'There is a user in the JavaScript community who goes around adding "backwards compatibility" to projects. They do this by adding 50 extra package dependencies to your project, which are maintained by them.',
    link: { url: 'https://github.com/immich-app/immich/pull/10690', text: '#10690' },
    date: new Date(2024, 5, 28),
  },
  {
    icon: mdiLockOutline,
    iconColor: 'gold',
    title: 'Long passwords are cursed',
    description:
      'The bcrypt implementation only uses the first 72 bytes of a string. Any characters after that are ignored.',
    // link: GHSA-4p64-9f7h-3432
    date: new Date(2024, 5, 25),
  },
  {
    icon: mdiCalendarToday,
    iconColor: 'greenyellow',
    title: 'JavaScript Date objects are cursed',
    description: 'JavaScript date objects are 1 indexed for years and days, but 0 indexed for months.',
    link: { url: 'https://github.com/immich-app/immich/pulls/6787', text: '#6787' },
    date: new Date(2024, 0, 31),
  },
];

export default function CursedKnowledgePage(): JSX.Element {
  return (
    <Layout title="Cursed Knowledge" description="Things we wish we didn't know">
      <section className="my-8">
        <h1 className="md:text-6xl text-center mb-10 text-immich-primary dark:text-immich-dark-primary px-2">
          Cursed Knowledge
        </h1>
        <p className="text-center text-xl px-2">
          Cursed knowledge we have learned as a result of building Immich that we wish we never knew.
        </p>
        <div className="flex justify-around mt-8 w-full max-w-full">
          <Timeline
            items={items
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((item) => ({ ...item, getDateLabel: withLanguage(item.date) }))}
          />
        </div>
      </section>
    </Layout>
  );
}
