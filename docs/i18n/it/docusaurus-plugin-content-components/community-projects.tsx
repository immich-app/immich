import Link from '@docusaurus/Link';
import React from 'react';

interface CommunityProjectProps {
  titolo: string;
  descrizione: string;
  url: string;
}

const progetti: CommunityProjectProps[] = [
  {
    titolo: 'immich-go',
    descrizione: `Un'alternativa a immich-CLI che non dipende da Node.js. Specializzato nell'importazione degli archivi Google Photos Takeout.`,
    url: 'https://github.com/simulot/immich-go',
  },
  {
    titolo: 'ImmichFrame',
    descrizione: 'Esegui una presentazione Immich in una cornice digitale.',
    url: 'https://github.com/3rob3/ImmichFrame',
  },
  {
    titolo: 'API Album Sync',
    descrizione: 'Script Python per sincronizzare cartelle come album.',
    url: 'https://git.orenit.solutions/open/immichalbumpull',
  },
  {
    titolo: 'Rimuovi file offline',
    descrizione: 'Un modo semplice per rimuovere asset orfani/offline dal database Immich.',
    url: 'https://github.com/Thoroslives/immich_remove_offline_files',
  },
  {
    titolo: 'Immich-Tools',
    descrizione: 'Fornisce script per gestire i problemi nella pagina di riparazione.',
    url: 'https://github.com/clumsyCoder00/Immich-Tools',
  },
  {
    titolo: 'Plugin Lightroom: mi.Immich.Publisher',
    descrizione: 'Plugin Lightroom per pubblicare foto da raccolte Lightroom ad album Immich.',
    url: 'https://github.com/midzelis/mi.Immich.Publisher',
  },
  {
    titolo: 'Plugin Lightroom: lrc-immich-plugin',
    descrizione:
      'Plugin Lightroom per pubblicare ed esportare foto verso Immich. Supporta anche l\'importazione da Immich a Lightroom.',
    url: 'https://blog.fokuspunk.de/lrc-immich-plugin/',
  },
  {
    titolo: 'Immich-Tiktok-Remover',
    descrizione: 'Script per cercare e rimuovere video TikTok dalla tua libreria Immich.',
    url: 'https://github.com/mxc2/immich-tiktok-remover',
  },
  {
    titolo: 'Immich Android TV',
    descrizione: 'App non ufficiale di Immich per Android TV.',
    url: 'https://github.com/giejay/Immich-Android-TV',
  },
  {
    titolo: 'Crea album da cartelle',
    descrizione: 'Script Python per creare album basati sulla struttura delle cartelle di una libreria esterna.',
    url: 'https://github.com/Salvoxia/immich-folder-album-creator',
  },
  {
    titolo: 'Modulo Powershell PSImmich',
    descrizione: 'Modulo Powershell per l’API Immich.',
    url: 'https://github.com/hanpq/PSImmich',
  },
  {
    titolo: 'Distribuzione Immich',
    descrizione: 'Pacchetto Snap per installazione semplice e aggiornamenti automatici senza manutenzione di Immich.',
    url: 'https://immich-distribution.nsg.cc',
  },
  {
    titolo: 'Immich Kiosk',
    descrizione: 'Presentazione leggera per dispositivi kiosk e browser.',
    url: 'https://github.com/damongolding/immich-kiosk',
  },
  {
    titolo: 'Immich Power Tools',
    descrizione: 'Strumenti avanzati per organizzare la libreria Immich.',
    url: 'https://github.com/varun-raj/immich-power-tools',
  },
  {
    titolo: 'Immich Public Proxy',
    descrizione:
      'Condividi in sicurezza foto e album Immich senza esporre pubblicamente la tua istanza.',
    url: 'https://github.com/alangrainger/immich-public-proxy',
  },
  {
    titolo: 'Immich Kodi',
    descrizione: 'Plugin non ufficiale di Kodi per Immich.',
    url: 'https://github.com/vladd11/immich-kodi',
  },
  {
    titolo: 'Immich Downloader',
    descrizione: 'Scarica un numero configurabile di foto casuali basate su persone o ID album.',
    url: 'https://github.com/jon6fingrs/immich-dl',
  },
  {
    titolo: 'Immich Upload Optimizer',
    descrizione: 'Ottimizza automaticamente i file caricati su Immich per risparmiare spazio di archiviazione.',
    url: 'https://github.com/miguelangel-nubla/immich-upload-optimizer',
  },
  {
    titolo: 'Bilanciatore ML Immich',
    descrizione: 'Accelera il machine learning bilanciando le richieste tra più computer.',
    url: 'https://github.com/apetersson/immich_ml_balancer',
  },
];

function ProgettoCommunity({ titolo, descrizione, url }: CommunityProjectProps): JSX.Element {
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
          Vai al progetto
        </Link>
      </div>
    </section>
  );
}

export default function ProgettiCommunity(): JSX.Element {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {progetti.map((p) => (
        <ProgettoCommunity key={p.url} {...p} />
      ))}
    </div>
  );
}