Immich allows the admin user to set the pattern of how the files are uploaded to the Immich would look like. Both in the directory and the filename level.

The admin user can set the template by using the template builder in the `Administration -> Settings -> Storage Template`. Immich provides a set of variables that you can use in constructing the template, along with additional custom text.

```bash title="Default template"
Year/Year-Month-Day/Filename.Extension
```

<img src={require('./img/storage-template.png').default} width="100%" title="Storage Template Setting" />

Immich also provides a mechanism to migrate between template so that if the template you set now doesn't work in the future, you can always migrate all the existing files to the new template. The mechanism is run as a job in the Job page.
