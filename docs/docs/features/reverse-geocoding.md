# Reverse Geocoding

Immich supports local [Reverse Geocoding](https://en.wikipedia.org/wiki/Reverse_geocoding) using data from the [GeoNames](https://www.geonames.org/) geographical database. This data is loaded into the Postgres database on each minor version upgrade, allowing all queries to be run on your own server.

## Extraction

During Exif Extraction, assets with latitudes and longitudes are reverse geocoded to determine their City, State, and Country.

## Usage

Data from a reverse geocode is displayed in the image details, and used in [Smart Search](/docs/features/searching.md).

<img src={require('./img/reverse-geocoding-mobile3.webp').default} width='33%' title='Reverse Geocoding' />
<img src={require('./img/reverse-geocoding-mobile1.webp').default} width='33%' title='Reverse Geocoding' />
<img src={require('./img/reverse-geocoding-mobile2.webp').default} width='33%' title='Reverse Geocoding' />
