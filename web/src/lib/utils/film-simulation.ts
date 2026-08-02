import type { FilmSimulationBannerId } from './film-simulation-banner';

export const FUJI_FILM_SIMULATION_SLUGS = [
  'provia-standard',
  'velvia-vivid',
  'astia-soft',
  'classic-chrome',
  'reala-ace-v2',
  'pro-neg-hi',
  'pro-neg-std',
  'classic-neg',
  'nostalgic-neg',
  'eterna-cinema',
  'bleach-bypass',
  'acros',
  'acros-g-filter',
  'acros-r-filter',
  'acros-ye-filter',
  'monochrome',
  'monochrome-g-filter',
  'monochrome-r-filter',
  'monochrome-ye-filter',
  'sepia',
] as const;

export type FujiFilmSimulationSlug = (typeof FUJI_FILM_SIMULATION_SLUGS)[number];

export type FilmSimulationGraphic = {
  slug: FujiFilmSimulationSlug;
  label: string;
  src: string;
  banner?: FilmSimulationBannerId;
};

const graphic = (
  slug: FujiFilmSimulationSlug,
  label: string,
  filename: string,
  banner?: FilmSimulationBannerId,
): FilmSimulationGraphic => ({
  slug,
  label,
  src: `/film-simulations/${filename}.png`,
  banner,
});

/**
 * Canonical renderer profiles, in the order shown by the RAW editor.
 *
 * Keep this as the single source of truth for both the selectable renderer
 * slugs and the existing EXIF-to-banner presentation mapping. In particular,
 * REALA ACE intentionally resolves to the validated v2 renderer profile.
 */
export const FUJI_FILM_SIMULATIONS: readonly FilmSimulationGraphic[] = [
  graphic('provia-standard', 'PROVIA', 'provia', 'provia'),
  graphic('velvia-vivid', 'Velvia', 'velvia', 'velvia'),
  graphic('astia-soft', 'ASTIA', 'astia', 'astia'),
  graphic('classic-chrome', 'CLASSIC CHROME', 'classic-chrome'),
  graphic('reala-ace-v2', 'REALA ACE', 'reala-ace', 'realaAce'),
  graphic('pro-neg-hi', 'PRO Neg. Hi', 'pro-neg-hi', 'proNegHi'),
  graphic('pro-neg-std', 'PRO Neg. Std', 'pro-neg-std', 'proNegStd'),
  graphic('classic-neg', 'CLASSIC Neg.', 'classic-neg', 'classicNeg'),
  graphic('nostalgic-neg', 'NOSTALGIC Neg.', 'nostalgic-neg', 'nostalgicNeg'),
  graphic('eterna-cinema', 'ETERNA', 'eterna', 'eterna'),
  graphic('bleach-bypass', 'ETERNA BLEACH BYPASS', 'eterna-bleach-bypass', 'eternaBleachBypass'),
  graphic('acros', 'ACROS', 'acros', 'acros'),
  graphic('acros-g-filter', 'ACROS+ G FILTER', 'acros-g-filter', 'acros'),
  graphic('acros-r-filter', 'ACROS+ R FILTER', 'acros-r-filter', 'acros'),
  graphic('acros-ye-filter', 'ACROS+ Ye FILTER', 'acros-ye-filter', 'acros'),
  graphic('monochrome', 'MONOCHROME', 'monochrome', 'monochrome'),
  graphic('monochrome-g-filter', 'MONOCHROME+ G FILTER', 'monochrome-g-filter', 'monochrome'),
  graphic('monochrome-r-filter', 'MONOCHROME+ R FILTER', 'monochrome-r-filter', 'monochrome'),
  graphic('monochrome-ye-filter', 'MONOCHROME+ Ye FILTER', 'monochrome-ye-filter', 'monochrome'),
  graphic('sepia', 'SEPIA', 'sepia', 'sepia'),
];

const simulationsBySlug = new Map(FUJI_FILM_SIMULATIONS.map((simulation) => [simulation.slug, simulation]));

export const isFujiFilmSimulationSlug = (value: unknown): value is FujiFilmSimulationSlug =>
  typeof value === 'string' && simulationsBySlug.has(value as FujiFilmSimulationSlug);

export const getFilmSimulationBySlug = (slug: FujiFilmSimulationSlug): FilmSimulationGraphic =>
  simulationsBySlug.get(slug)!;

const hasFilter = (value: string, color: 'green' | 'red' | 'yellow') => {
  const aliases = color === 'yellow' ? ['yellow', ' ye '] : [color];
  return aliases.some((alias) => value.includes(alias));
};

/** Resolve the many EXIF spellings emitted by Fujifilm cameras and ExifTool. */
export const getFilmSimulationGraphic = (filmMode: string): FilmSimulationGraphic | undefined => {
  const value = ` ${filmMode
    .toLowerCase()
    .replaceAll(/[+._/-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()} `;

  if (value.includes(' reala ace ')) {
    return getFilmSimulationBySlug('reala-ace-v2');
  }

  if (value.includes(' bleach bypass ')) {
    return getFilmSimulationBySlug('bleach-bypass');
  }

  if (value.includes(' nostalgic neg')) {
    return getFilmSimulationBySlug('nostalgic-neg');
  }

  if (value.includes(' classic neg')) {
    return getFilmSimulationBySlug('classic-neg');
  }

  if (value.includes(' classic chrome ')) {
    return getFilmSimulationBySlug('classic-chrome');
  }

  if (value.includes(' pro neg hi ')) {
    return getFilmSimulationBySlug('pro-neg-hi');
  }

  if (value.includes(' pro neg std ')) {
    return getFilmSimulationBySlug('pro-neg-std');
  }

  if (value.includes(' acros ')) {
    if (hasFilter(value, 'green')) {
      return getFilmSimulationBySlug('acros-g-filter');
    }
    if (hasFilter(value, 'red')) {
      return getFilmSimulationBySlug('acros-r-filter');
    }
    if (hasFilter(value, 'yellow')) {
      return getFilmSimulationBySlug('acros-ye-filter');
    }
    return getFilmSimulationBySlug('acros');
  }

  if (value.includes(' monochrome ') || value.includes(' b&w ')) {
    if (hasFilter(value, 'green')) {
      return getFilmSimulationBySlug('monochrome-g-filter');
    }
    if (hasFilter(value, 'red')) {
      return getFilmSimulationBySlug('monochrome-r-filter');
    }
    if (hasFilter(value, 'yellow')) {
      return getFilmSimulationBySlug('monochrome-ye-filter');
    }
    return getFilmSimulationBySlug('monochrome');
  }

  if (value.includes(' sepia ')) {
    return getFilmSimulationBySlug('sepia');
  }

  if (value.includes(' eterna ')) {
    return getFilmSimulationBySlug('eterna-cinema');
  }

  if (value.includes(' astia ') || value.includes(' studio portrait ')) {
    return getFilmSimulationBySlug('astia-soft');
  }

  if (value.includes(' velvia ') || value.includes(' fujichrome ')) {
    return getFilmSimulationBySlug('velvia-vivid');
  }

  if (value.includes(' provia ') || value.includes(' standard ')) {
    return getFilmSimulationBySlug('provia-standard');
  }
};
