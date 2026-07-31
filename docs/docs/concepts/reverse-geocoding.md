# Reverse Geocoding

Reverse geocoding turns the coordinates stored in a photo into place names — city, state, and country. Immich does this [locally](https://en.wikipedia.org/wiki/Reverse_geocoding) using a copy of the [GeoNames](https://www.geonames.org/) geographical database that lives in your own Postgres database, so no coordinates are ever sent to a third-party service.

## How it works

1. The [Metadata Extraction](/reference/jobs#extract-metadata) job reads `GPSLatitude` and `GPSLongitude` from the asset. Coordinates of exactly `0,0` are treated as no location, since that is what many devices write when there is no GPS fix.
2. If reverse geocoding is enabled, those coordinates are looked up against the GeoNames data already loaded into Postgres.
3. Immich searches for populated places within roughly 25 km of the coordinates and takes the **nearest** one.
4. That place supplies the city name and the state (its first-level administrative division); the country comes from the place's ISO country code.
5. The resulting city, state, and country are stored on the asset alongside the coordinates.

Because the result is stored rather than computed on demand, it is only recalculated when metadata extraction runs again for that asset.

## When no place is nearby

The GeoNames data Immich uses covers populated places with a population of 500 or more. Coordinates in the ocean, in wilderness, or in sparsely populated regions may have no such place within the search radius.

In that case Immich falls back to matching the coordinates against country boundaries, which yields a **country only** — no state and no city. If even that fails, the asset keeps its coordinates but has no place names at all.

The nearest-match rule also means a photo taken between towns is attributed to whichever qualifying place is closest, which is not necessarily the one you would name yourself.

## What the place names are used for

The stored values drive three things:

- The location shown in the asset detail panel.
- The **Locations** filter in [search](/user-guide/search-your-library), which matches on city, state, and country.
- Grouping in the Places view.

Coordinates themselves are what the map view uses, so the map still works for assets whose reverse geocoding produced nothing.

<img src={require('./img/reverse-geocoding-mobile3.webp').default} width='33%' title='Reverse Geocoding' />
<img src={require('./img/reverse-geocoding-mobile1.webp').default} width='33%' title='Reverse Geocoding' />
<img src={require('./img/reverse-geocoding-mobile2.webp').default} width='33%' title='Reverse Geocoding' />

## Keeping the data current

The GeoNames dataset is imported into Postgres on minor version upgrades, so place names improve as the dataset does. Existing assets are not re-geocoded automatically — re-running metadata extraction is what applies newer data to assets that were already processed.

Reverse geocoding can be turned off entirely in `Administration > Settings > Map & GPS Settings`. Coordinates continue to be extracted and stored when it is disabled; only the place-name lookup is skipped.
