import Link from '@docusaurus/Link';
import React from 'react';

interface GuidaCommunityProps {
  titolo: string;
  descrizione: string;
  url: string;
}

const guide: GuidaCommunityProps[] = [
  {
    titolo: 'Cloudflare Tunnels con SSO/OAuth',
    descrizione: `Configurazione di Cloudflare Tunnels e di una SaaS App per Immich.`,
    url: 'https://github.com/immich-app/immich/discussions/8299',
  },
  {
    titolo: 'Backup del database in TrueNAS',
    descrizione: `Creare un backup del database con pgAdmin in TrueNAS.`,
    url: 'https://github.com/immich-app/immich/discussions/8809',
  },
  {
    titolo: 'Script di backup per Unraid',
    descrizione: `Esegui il backup dei tuoi asset in Unraid con uno script già pronto.`,
    url: 'https://github.com/immich-app/immich/discussions/8416',
  },
  {
    titolo: 'Sincronizza cartelle con album',
    descrizione: `Sincronizza le cartelle della libreria importata con album che hanno lo stesso nome.`,
    url: 'https://github.com/immich-app/immich/discussions/3382',
  },
  {
    titolo: 'Installazione Podman/Quadlets',
    descrizione: 'Documentazione per una configurazione semplice di Podman usando i quadlets.',
    url: 'https://github.com/tbelway/immich-podman-quadlets/blob/main/docs/install/podman-quadlet.md',
  },
  {
    titolo: 'Importa Google Photos + album',
    descrizione: 'Importa i tuoi file Google Photos in Immich e aggiungi i tuoi album.',
    url: 'https://github.com/immich-app/immich/discussions/1340',
  },
  {
    titolo: 'Accedere a Immich con dominio personalizzato',
    descrizione: 'Accedi alla tua installazione locale di Immich tramite internet usando il tuo dominio.',
    url: 'https://github.com/ppr88/immich-guides/blob/main/open-immich-custom-domain.md',
  },
  {
    titolo: 'Nginx caching map server',
    descrizione: 'Aumenta la privacy usando Nginx come proxy cache davanti a un map tile server.',
    url: 'https://github.com/pcouy/pcouy.github.io/blob/main/_posts/2024-08-30-proxying-a-map-tile-server-for-increased-privacy.md',
  },
  {
    titolo: 'Configurazione fail2ban',
    descrizione: 'Come configurare una installazione esistente di fail2ban per bloccare tentativi di login errati.',
    url: 'https://github.com/immich-app/immich/discussions/3243#discussioncomment-6681948',
  },
  {
    titolo: 'Accesso remoto a Immich con NordVPN Meshnet',
    descrizione: 'Accedi a Immich con una connessione crittografata end-to-end.',
    url: 'https://meshnet.nordvpn.com/how-to/remote-files-media-access/immich-remote-access',
  },
  {
    titolo: 'Certificati self-signed con Immich - Configurazione OAuth',
    descrizione:
      'Configura la fiducia con un Certificate Authority privata per Immich e il tuo servizio OAuth2/OpenID, usando HTTPS con una CA privata.',
    url: 'https://github.com/immich-app/immich/discussions/18614',
  },
];

function GuidaCommunity({ titolo, descrizione, url }: GuidaCommunityProps): JSX.Element {
  return (
    <section className="flex flex-col gap-4 justify-between dark:bg-immich-dark-gray bg-immich-gray dark:border-0 border-gray-200 border border-solid rounded-2xl px-4 py-6">
      <div className="flex flex-col gap-2">
        <p className="m-0 items-start flex gap-2 text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">
          <span>{titolo}</span>
        </p>

        <p className="m-0 text-sm text-gray-600 dark:text-gray-300">{descrizione}</p>
        <p className="m-0 text-sm text-gray-600 dark:text-gray-300 my-4">
          <a href={url}>{url}</a>
        </p>
      </div>
      <div className="flex">
        <Link
          className="px-4 py-2 bg-immich-primary/10 dark:bg-gray-300 rounded-xl text-sm hover:no-underline text-immich-primary dark:text-immich-dark-bg font-semibold"
          to={url}
        >
          Vedi guida
        </Link>
      </div>
    </section>
  );
}

export default function GuideCommunity(): JSX.Element {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {guide.map((g) => (
        <GuidaCommunity key={g.url} {...g} />
      ))}
    </div>
  );
}