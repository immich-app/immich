<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg?color=3F51B5&style=for-the-badge&label=License&logoColor=000000&labelColor=ececec" alt="License: MIT"></a>
  <a href="https://github.com/alextran1502/immich"><img src="https://img.shields.io/github/stars/alextran1502/immich.svg?style=for-the-badge&logo=github&color=3F51B5&label=Stars&logoColor=000000&labelColor=ececec" alt="Star on Github"></a>
  <a href="https://immichci.little-home.net/viewType.html?buildTypeId=Immich_BuildAndroidAndGetArtifact&guest=1">
    <img src="https://img.shields.io/teamcity/http/immichci.little-home.net/s/Immich_BuildAndroidAndGetArtifact.svg?style=for-the-badge&label=Android&logo=teamcity&logoColor=000000&labelColor=ececec" alt="Android Build"/>
  </a>
  <a href="https://immichci.little-home.net/viewType.html?buildTypeId=Immich_BuildAndPublishIOSToTestFlight&guest=1">
    <img src="https://img.shields.io/teamcity/http/immichci.little-home.net/s/Immich_BuildAndPublishIOSToTestFlight.svg?style=for-the-badge&label=iOS&logo=teamcity&logoColor=000000&labelColor=ececec" alt="iOS Build"/>
  </a>
  <a href="https://actions-badge.atrox.dev/alextran1502/immich/goto?ref=main">
    <img alt="Build Status" src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Falextran1502%2Fimmich%2Fbadge%3Fref%3Dmain&style=for-the-badge&label=Server Docker&logo=docker&labelColor=ececec" />
  </a>
  
  <br/>  
  <br/>  
  <br/>  
  <br/>  

  <p align="center">
    <img src="design/immich-logo.svg" width="200" title="Immich Logo">
  </p>
</p>

# Immich

Self-hosted photo and video backup solution directly from your mobile phone.

![](https://media.giphy.com/media/y8ZeaAigGmNvlSoKhU/giphy.gif)

Loading ~4000 images/videos

## Screenshots

<p align="left">
  <img src="design/login-screen.png" width="150" title="Login With Custom URL">
  <img src="design/backup-screen.png" width="150" title="Backup Setting Info">
  <img src="design/selective-backup-screen.png" width="150" title="Backup Setting Info">
  <img src="design/home-screen.jpeg" width="150" title="Home Screen">
  <img src="design/search-screen.jpeg" width="150" title="Curated Search Info">
  <img src="design/shared-albums.png" width="150" title="Shared Albums">
  <img src="design/nsc6.png" width="150" title="EXIF Info">

</p>

# Note

**!! NOT READY FOR PRODUCTION! DO NOT USE TO STORE YOUR ASSETS !!**

This project is under heavy development, there will be continous functions, features and api changes.

# Features

- Upload and view assets (videos/images).
- Auto Backup.
- Download asset to local device.
- Multi-user supported.
- Quick navigation with drag scroll bar.
- Support HEIC/HEIF Backup.
- Extract and display EXIF info.
- Real-time render from multi-device upload event.
- Image Tagging/Classification based on ImageNet dataset
- Object detection based on COCO SSD.
- Search assets based on tags and exif data (lens, make, model, orientation)
- [Optional] Reverse geocoding using Mapbox (Generous free-tier of 100,000 search/month)
- Show asset's location information on map (OpenStreetMap).
- Show curated places on the search page
- Show curated objects on the search page
- Shared album with users on the same server
- Selective backup - albums can be included and excluded during the backup process.


# System Requirement

**OS**: Preferred Linux-based operating system (Ubuntu, Debian, MacOS...etc). 

I haven't tested with `Docker for Windows` as well as `WSL` on Windows

*Raspberry Pi can be used but `microservices` container has to be comment out in `docker-compose` since TensorFlow has not been supported in Dockec image on arm64v7 yet.*

**RAM**: At least 2GB, preffered 4GB.

**Core**: At least 2 cores, preffered 4 cores.

# Development and Testing out the application

You can use docker compose for development and testing out the application, there are several services that compose Immich:

1. **NestJs** - Backend of the application
2. **PostgreSQL** - Main database of the application
3. **Redis** - For sharing websocket instance between docker instances and background tasks message queue.
4. **Nginx** - Load balancing and optimized file uploading.
5. **TensorFlow** - Object Detection and Image Classification.

## Step 1: Populate .env file

Navigate to `docker` directory and run

```
cp .env.example .env
```

Then populate the value in there.

Notice that if set `ENABLE_MAPBOX` to `true`, you will have to provide `MAPBOX_KEY` for the server to run.

Pay attention to the key `UPLOAD_LOCATION`, this directory must exist and is owned by the user that run the `docker-compose` command below.

**Example**

```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE_NAME=immich

# Upload File Config
UPLOAD_LOCATION=<put-the-path-of-the-upload-folder-here>

# JWT SECRET
JWT_SECRET=randomstringthatissolongandpowerfulthatnoonecanguess

# MAPBOX
## ENABLE_MAPBOX is either true of false -> if true, you have to provide MAPBOX_KEY
ENABLE_MAPBOX=false
MAPBOX_KEY=
```

## Step 2: Start the server

To start, run

```bash
docker-compose -f ./docker/docker-compose.yml up 
```

If you have a few thousand photos/videos, I suggest running docker-compose with scaling option for the `immich_server` container to handle high I/O load when using fast scrolling.

```bash
docker-compose -f ./docker/docker-compose.yml up --scale immich_server=5 
```


The server will be running at `http://your-ip:2283` through `Nginx`

## Step 3: Register User

Use the command below on your terminal to create user as we don't have user interface for this function yet.

```bash
curl --location --request POST 'http://your-server-ip:2283/auth/signUp' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "testuser@email.com",
    "password": "password"
}'
```

## Step 4: Run mobile app

The app is distributed on several platforms below.

## F-Droid
You can get the app on F-droid by clicking the image below.

[<img src="https://fdroid.gitlab.io/artwork/badge/get-it-on.png"
    alt="Get it on F-Droid"
    height="80">](https://f-droid.org/packages/app.alextran.immich)


## Android

#### Get the app on Google Play Store [here](https://play.google.com/store/apps/details?id=app.alextran.immich) 

*The App version might be lagging behind the latest release due to the review process.*

<p align="left">
  <img src="design/google-play-qr-code.png" width="200" title="Google Play Store">
<p/>

## iOS

#### Get the app on Apple AppStore [here](https://apps.apple.com/us/app/immich/id1613945652):

*The App version might be lagging behind the latest release due to the review process.*


<p align="left">
  <img src="design/ios-qr-code.png" width="200" title="Apple App Store">
<p/>

# Support

If you like the app, find it helpful, and want to support me to offset the cost of publishing to AppStores, you can sponsor the project with [**Github Sponsore**](https://github.com/sponsors/alextran1502), or one time donation with Buy Me a coffee link below.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/altran1502)

This is also a meaningful way to give me motivation and encounragment to continue working on the app.

Cheer! 🎉

# Known Issue

## TensorFlow Build Issue

*This is a known issue on RaspberryPi 4 arm64-v7 and incorrect Promox setup*

TensorFlow doesn't run with older CPU architecture, it requires CPU with AVX and AVX2 instruction set. If you encounter the error `illegal instruction core dump` when running the docker-compose command above, check for your CPU flags with the command and make sure you see `AVX` and `AVX2`:
 
```bash
more /proc/cpuinfo | grep flags
``` 
  
If you are running virtualization in Promox, the VM doesn't have the flag enable.
  
You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.
  
`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`
 
Otherwise you can:
- edit `docker-compose.yml` file and comment the whole `immich_microservices` service **which will disable machine learning features like object detection and image classification**
- switch to a different VM/desktop with different architecture.
