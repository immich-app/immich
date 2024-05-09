Immich allows the admin user to set the uploaded filename pattern at the directory and filename level as well as the [storage label for a user](/docs/administration/user-management/#set-storage-label-for-user).

:::note new version
On new machines running version 1.92.0 storage template engine is off by default, for [more info](https://github.com/immich-app/immich/releases/tag/v1.92.0#:~:text=the%20partner%E2%80%99s%20assets.-,Hardening%20storage%20template,-We%20have%20further).
:::

:::tip
You can read more about the differences between storage template engine on and off [here](/docs/administration/backup-and-restore#asset-types-and-storage-locations)
:::

The admin user can set the template by using the template builder in the `Administration -> Settings -> Storage Template`. Immich provides a set of variables that you can use in constructing the template, along with additional custom text. If the template produces [multiple files with the same filename, they won't be overwritten](https://github.com/immich-app/immich/discussions/3324) as a sequence number is appended to the filename.

```bash title="Default template"
Year/Year-Month-Day/Filename.Extension
```

If you want to change the storage template during the initial setup, first enable the feature.

<img src={require('./img/enable-storage-template.png').default} width="100%" title="Enable Storage Template Setting" />

Then, customize your storage template.

<img src={require('./img/storage-template.png').default} width="100%" title="Storage Template Setting" />

:::tip
If an asset is in multiple albums, `{{album}}` will be set to the name of the album which was most recently created. By default, special characters will be converted to an HTML entity (for example, `&` -> `&amp;`). To prevent this, wrap the variable in an extra set of braces (for example, `{{{album}}}`). You can learn more about this [here](https://handlebarsjs.com/guide/expressions.html#html-escaping) and [here](https://github.com/immich-app/immich/issues/4917).
:::

Immich also provides a mechanism to migrate between templates so that if the template you set now doesn't work in the future, you can always migrate all the existing files to the new template. The mechanism is run as a job on the Job page.
