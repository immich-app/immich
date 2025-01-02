# Tags

Immich supports hierarchical tags, with the ability to read existing tags from the `TagList` and `Keywords` EXIF properties. Any changes to tags made through Immich are also written back to a [sidecar](/docs/features/xmp-sidecars) file. You can re-run the metadata extraction jobs for all assets to import your existing tags.

## Enable tags feature

You can enable this feature from the [`Account Settings > Features > Tags`](https://my.immich.app/user-settings?isOpen=feature+tags).

<img src={require('./img/tag-enable.webp').default} width="50%" title='Tag view enable' />

## Creating tags

Tags can be created and added to a photo or a video by clicking on the `+ Add` button at the bottom of the info panel.

<img src={require('./img/tag-creation.webp').default} width="40%" title='Tag view enable' />

The tag prompt will appear, and you find and select a tag, or type in a new tag to create it.

<img src={require('./img/tag-form.webp').default} width="40%" title='Tag form' />

## Viewing tags

You can navigate to the `Tags` view from the side navigation bar or by clicking on the tag in the info panel.

<img src={require('./img/tag-view.webp').default} width="80%" title='Tag form' />
