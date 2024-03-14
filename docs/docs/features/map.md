# Global Map View

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info Internet connection
In order for the map feature to work as expected, an Internet connection is necessary, when using the map your IP address will be visible to the map service provider.
:::

To provide a better user experience, Immich allows viewing the location of the images on a world map.
When several photos were taken in the same relative area, a number representing the amount of photos taken in that area will be displayed. When zooming, more and more images will be displayed from the enlarged area.

Your photo may have a location if:

- Your device's camera saves your location with the photo.
- You add a location.

<Tabs>
  <TabItem value="Computer" label="Computer" default>

<img src={require('./img/map-zoom.webp').default} width="80%" title='Map Zoom' />

### Map Settings

User can adjust which images to display in the map:

- Photos from Date range.
- Favorite photos only.
- Images included in the archive.
- Photos shared with me.

To change these options, click on the ⚙ on the top right side of the map.

## Manage your photos' location

To manage your photo or video location information, you can either add a location to a photo that doesn't have one or edit location to an existing location.

### Add/Edit a location

1. Open the photo or video.
2. Click Info ℹ and then add a location.

:::tip
You can mark several photos from the timeline and edit their location, to do this select several photos and click on the 3 dots on the top right -> change location.
:::

### Remove location

Currently, the location cannot be removed.

</TabItem>
  <TabItem value="Mobile" label="Mobile">

The mobile app also supports image display on the map, although some features are not available for the map view in the app version. Some of the unavailable features include:

- Photos shared with me.

<img src={require('./img/app-map.png').default} width="30%" title='Map App' />

### Add/Edit a location

1. Open the photo or video.
2. Slide up and then add a location.

:::tip
You can mark several photos from the timeline and edit their location, to do this select several photos and swipe right -> Edit Location.
:::

### Remove location

Currently, the location cannot be removed.

</TabItem>
</Tabs>
