Immich allows the admin user to set the uploaded filename pattern at the directory and filename level as well as the [storage label for a user](/docs/administration/user-management/#set-storage-label-for-user).

:::tip
You can read more about the differences between storage template engine on and off [here](/docs/administration/backup-and-restore#asset-types-and-storage-locations)
:::

The admin user can set the template by using the template builder in the `Administration -> Settings -> Storage Template`. Immich provides a set of variables that you can use in constructing the template, along with additional custom text. If the template produces [multiple files with the same filename, they won't be overwritten](https://github.com/immich-app/immich/discussions/3324) as a sequence number is appended to the filename.

```bash title="Default template"
Year/Year-Month-Day/Filename.Extension
```

If you want to change the storage template during the initial setup, first enable the feature.

<img src={require('./img/enable-storage-template.webp').default} width="80%" title="Enable Storage Template Setting" />

Then, customize your storage template.

<img src={require('./img/storage-template.webp').default} width="80%" title="Storage Template Setting" />

:::info
The `Storage Template Migration` job can be run after enabling this feature or changing the template, in order to apply the changes to the existing library.

<img src={require('./img/storage-template-migration-job.webp').default} width="80%" title="Storage Template Setting" />

:::

:::tip
If an asset is in multiple albums, `{{album}}` will be set to the name of the album which was most recently created. By default, special characters will be converted to an HTML entity (for example, `&` -> `&amp;`). To prevent this, wrap the variable in an extra set of braces (for example, `{{{album}}}`). You can learn more about this [here](https://handlebarsjs.com/guide/expressions.html#html-escaping) and [here](https://github.com/immich-app/immich/issues/4917).
:::

Immich also provides a mechanism to migrate between templates so that if the template you set now doesn't work in the future, you can always migrate all the existing files to the new template. The mechanism is run as a job on the Job page.

If you want to store assets in album folders, but you also have assets that do not belong to any album, you can use `{{#if album}}`, `{{else}}` and `{{/if}}` to create a conditional statement. For example, the following template will store assets in album folders if they belong to an album, and in a folder named "Other/Month" if they do not belong to an album:

```
{{y}}/{{#if album}}{{album}}{{else}}Other{{/if}}/{{MM}}/{{filename}}
```
