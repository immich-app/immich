# Map Filtering

The map view supports the same filter panel available on the Photos and Spaces pages. Filter map markers by people, camera, tags, rating, favorites, media type, and date range.

## How it works

Open the map from the sidebar or from a Space's map button. The filter panel appears on the left side, expanded by default.

- **People** — show only photos containing specific people
- **Camera** — filter by camera make and model
- **Tags** — narrow to photos with specific tags
- **Rating** — minimum star rating
- **Favorites** — toggle between all photos and favorites only
- **Media type** — photos, videos, or both
- **Timeline** — pick a year or month to see photos from that period

Markers on the map update as you change filters. When you click a cluster, the timeline panel also respects your active filters.

## Global map vs. space map

- **Global map** (`/map`) — shows your own geotagged photos with global filter suggestions
- **Space map** (`/map?spaceId=...`) — scoped to a specific space, with space-aware filter suggestions (only people and cameras that exist in that space)

## No location filter

The map itself serves as the location filter — pan and zoom to explore geographically. The filter panel omits the location section to avoid redundancy.
