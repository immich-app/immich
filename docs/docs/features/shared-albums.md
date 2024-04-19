# Shared Albums & Assets

## Shared Albums

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Album sharing allows you to share assets with other users or with people from around the world via a link or invitation (for system users).

When sharing shared albums, whats shared is:

- The selected assets.
- Metadata of the assets (Can be removed by sharing via link).

## Shared Album Features

- Download all assets as zip file (Web only).
  :::info Archive size limited.
  If the size of the album exceeds 4GB, the archive files will be divided into 4GB each.
  :::
- Add a description to the album (Web only).
- Slideshow view (Web only).
- Add or remove photos to an album.
- Comment on the album (for system users only).

:::info
When you create an album and it is not shared with anyone, it will be added to the Albums category.
:::

<Tabs>
  <TabItem value="Computer" label="Computer" default>

### Create a Shared Album

1. Select the assets (Shift can be used for multiple selection).
2. Click on the + on the top right -> add to a shared album.
3. Name the new album and add the album.

## Sharing Between Users

### Shared Album Options

- Add or remove users from the album.
  :::info remove user(s)
  When a user is removed from the album, the photos he uploaded will still appear in the album.
  :::
- Enable or disable comments & likes.
- Replace the album cover.
- Display order (newest first / oldest first).

To change these settings click on the 3 dots on the right -> options.

:::info Known bug
Currently it is not possible to remove people through the options.
This is a [known problem and it has a temporary solution](https://github.com/immich-app/immich/issues/7954)
:::

## Share Album via Link

:::info
When wanting to share with people outside the home network via a link, Immich needs to be exposed to the world wide web, read more to [learn the ways to do this](/docs/guides/remote-access.md).
:::

1. Enter the shared album.
2. Click on the share icon.
3. Click on Create link.

You can edit the link properties, options include;

- **Description -** adding a description to the album (optional)
- **Password -** adding a password to the album (optional), it is required to activate Require password.
- **Show metadata -** whether to show metadata to whoever the link will be shared with (optional).
- **Allow public user to download -** whether to allow whoever has the link to download all the images or a certain image (optional).
- **Allow public user to upload -** whether to allow whoever has the link to upload assets to the album (optional).
  :::info
  whoever has the link and have uploaded files cannot delete them.
  :::
- **Expire after -** adding an expiration date to the link (optional).

## Share Specific Assets

A user can share specific assets without linking them to a specific album.
in order to do so;

1. Go to the timeline
2. Select the assets (Shift can be used for multiple selection)
3. Click the share button

:::info
Assets shared in this way will not be displayed in the Sharing category, in order to expect to remove or change the link settings of assets shared in this way, you must use the Manage generated links option.
:::

:::tip
For temporary sharing, you can add an expiration date to assets shared this way.
:::

## Manage generated links

A user can copy, delete and change the link settings he created for specific albums or assets, in order to do so;

1. Go to the Immich home page.
2. Select the Sharing category.
3. On the top right, select Shared links.

:::info remove links/users.
When making a shared album private, the added photos will **still** be saved in the album.
:::

## Activity

:::info
Activity is not visible when sharing an album via external link.
New users added to the album will be able to see previous activity.
:::

### Add a Comment or Like to the Album

1. Enter the shared album.
2. From the bottom right you can add comment(s) or delete old comments.
3. To add a like (heart) to the album, click the heart button to the left of the "say something" button.

#### Add a Comment or Like to a Specific Photo

:::info Activity
Activity of a comment or heart on a specific photo will appear in the general activity of the album.
:::

1. Enter the shared album.
2. Enter the picture.
3. From the bottom right you can add comment(s) or delete old comments.
4. To add a like (heart) to the album, click the heart button to the left of the "say something" button.

### Viewing Activity in the Album

To view album activity on comments or likes

1. Enter the shared album
2. On the bottom right click on the message icon

</TabItem>
  <TabItem value="Mobile" label="Mobile">

:::note mobile app
Some of the features are not available on mobile, to understand what the full features of shared albums are, it is recommended to additionally read the explanation for the computer version.
:::

### Create a Shared Album

1. Select the assets.
2. Swipe up and click on Create new album.
3. Name the new album and add the album.

## Sharing Between Users

#### Add or remove users from the album.

:::info remove user(s)
When a user is removed from the album, the photos he uploaded will still appear in the album.
:::

After creating the album, click the Add User button and select the user you want to share with.

### Shared Album Options

- Enable or disable comments & likes.
- Add or remove users

To change these settings click on the 3 dots on the top right -> options.

## Share Album via Link

:::info
When wanting to share with people outside the home network via a link, Immich needs to be exposed to the world wide web, read more to [learn the ways to do this](/docs/guides/remote-access.md).
:::

1. Enter the shared album.
2. Click 3 dots on the top right.
3. Click on Share.

You can edit the link properties, options include;

- **Description -** adding a description to the album (optional)
- **Password -** adding a password to the album (optional)
- **Show metadata -** whether to show metadata to whoever the link will be shared with (optional).
- **Allow public user to download -** whether to allow whoever has the link to download all the images or a certain image (optional).
- **Allow public user to upload -** whether to allow whoever has the link to upload assets to the album (optional).
  ::: info
  whoever has the link and have uploaded files cannot delete them.
  :::
- **Expire after -** adding an expiration date to the link (optional).

## Share Specific Assets

A user can share specific assets without linking them to a specific album.
in order to do so;

1. Go to the timeline
2. Select the assets.
3. Click the share button

:::info
Assets shared in this way will not be displayed in the Sharing category, in order to expect to remove or change the link settings of assets shared in this way, you must use the Manage generated links option.
:::

:::tip
For temporary sharing, you can add an expiration date to assets shared this way.
:::

## Manage generated links

A user can copy, delete and change the link settings he created for specific albums or assets, in order to do so;

1. Go to Sharing category.
2. Select Shared links at the top right.

:::info remove links/users.
When making a shared album private, the added photos will **still** be saved in the album.
:::

## Activity

:::info
Activity is not visible when sharing an album via external link.
New users added to the album will be able to see previous activity.
:::

### Add a Comment or Like to the Album

1. Enter the shared album.
2. From the top right you can add comment(s) or delete old comments.
3. To add a like (heart) to the album, click the heart button to the right of the "say something" button.

#### Add a Comment or Like to a Specific Photo

:::info Activity
Activity of a comment or heart on a specific photo will appear in the general activity of the album.
:::

1. Enter the shared album.
2. Enter the picture.
3. From the top right you can add comment(s) or delete old comments.
4. To add a like (heart) to the album, click the heart button to the right of the "say something" button.

### Viewing Activity in the Album

To view album activity on comments or likes

1. Enter the shared album
2. On the top right click on the message icon

</TabItem>
</Tabs>
