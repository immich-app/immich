import { describe, expect, it } from 'vitest';
import { FUJI_FILM_SIMULATIONS, FUJI_FILM_SIMULATION_SLUGS, getFilmSimulationGraphic } from './film-simulation';

describe('FUJI_FILM_SIMULATIONS', () => {
  it('contains the renderer\'s 20 unique profile slugs in canonical order', () => {
    expect(FUJI_FILM_SIMULATIONS).toHaveLength(20);
    expect(FUJI_FILM_SIMULATIONS.map(({ slug }) => slug)).toEqual(FUJI_FILM_SIMULATION_SLUGS);
    expect(FUJI_FILM_SIMULATION_SLUGS).toEqual([
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
    ]);
    expect(new Set(FUJI_FILM_SIMULATION_SLUGS).size).toBe(20);
  });
});

describe(getFilmSimulationGraphic.name, () => {
  it.each([
    ['F0/Standard (Provia)', 'provia.png'],
    ['F1b/Studio Portrait Smooth Skin Tone (Astia)', 'astia.png'],
    ['F2/Fujichrome (Velvia)', 'velvia.png'],
    ['Classic Chrome', 'classic-chrome.png'],
    ['Pro Neg. Std', 'pro-neg-std.png'],
    ['Classic Negative', 'classic-neg.png'],
    ['Bleach Bypass', 'eterna-bleach-bypass.png'],
    ['Nostalgic Neg', 'nostalgic-neg.png'],
    ['Reala ACE', 'reala-ace.png'],
    ['ACROS+Ye Filter', 'acros-ye-filter.png'],
    ['Monochrome Red Filter', 'monochrome-r-filter.png'],
  ])('maps %s to the official graphic', (filmMode, filename) => {
    expect(getFilmSimulationGraphic(filmMode)?.src).toBe(`/film-simulations/${filename}`);
  });

  it('returns undefined for an unknown mode', () => {
    expect(getFilmSimulationGraphic('Future Film Mode')).toBeUndefined();
  });

  it('uses the validated REALA ACE v2 renderer profile', () => {
    expect(getFilmSimulationGraphic('Reala ACE')?.slug).toBe('reala-ace-v2');
  });

  it.each([
    ['F0/Standard (Provia)', 'provia'],
    ['F1b/Studio Portrait Smooth Skin Tone (Astia)', 'astia'],
    ['F2/Fujichrome (Velvia)', 'velvia'],
    ['Pro Neg. Std', 'proNegStd'],
    ['Classic Negative', 'classicNeg'],
    ['Bleach Bypass', 'eternaBleachBypass'],
    ['Nostalgic Neg', 'nostalgicNeg'],
    ['Reala ACE', 'realaAce'],
    ['ACROS+Ye Filter', 'acros'],
    ['Monochrome Red Filter', 'monochrome'],
    ['SEPIA', 'sepia'],
  ])('maps %s to the %s vector identity', (filmMode, banner) => {
    expect(getFilmSimulationGraphic(filmMode)?.banner).toBe(banner);
  });
});
