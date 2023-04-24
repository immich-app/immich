# Reverse Geocoding

Immich supports [Reverse Geocoding](https://en.wikipedia.org/wiki/Reverse_geocoding) using data from the [GeoNames](https://www.geonames.org/) geographical database.

## Extraction

During Exif Extraction, assets with latitudes and longitudes are reverse geocoded to determine their City, State, and Country.

## Usage

Data from a reverse geocode is displayed in the image details, and used in [Search](/docs/features/search.md).

<img src={require('./img/reverse-geocoding-mobile1.png').default} width='33%' title='Reverse Geocoding' />
<img src={require('./img/reverse-geocoding-mobile2.png').default} width='33%' title='Reverse Geocoding' />
