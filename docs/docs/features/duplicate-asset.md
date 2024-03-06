# Avoid Duplicate Asset

## Web Interface

In order to avoid duplicated assets, Immich uses a hash to make sure that assets can't be uploaded twice, when the user tries to upload an asset that already exists in the server the server rejects the file and show note.

<img src={require('./img/avoid-duplicate.png').default} width="30%" title="avoid duplicate message" />


## Mobile App

when the user tries to upload assets that already exist on the server from the mobile phone, the server rejects the file. In the app, it adds the rejected file to the blacklist so it's not trying to be reuploaded in the next backup.

you can see the blacklist inside the app at `Your Profile -> Settings -> Local Storage`.
