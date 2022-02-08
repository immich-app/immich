<p align="center">
  <img src="design/immich-logo.svg" width="150" title="hover text">
</p>

# IMMICH

Self-hosted photo and video backup solution directly from your mobile phone.

![](https://media.giphy.com/media/UcO3eQ1h6Bjm1Sqexd/giphy-downsized-large.gif)

# Note

This project is under heavy development, there will be continous functions, features and api changes.

**!! NOT READY FOR PRODUCTION! DO NOT USE TO STORE YOUR ASSETS !!**

# Features

[x] Upload assets(videos/images)

[x] View assets

[x] Quick navigation with drag scroll bar

[x] Auto Backup

# Development

You can use docker compose for development, there are several services that compose Immich

1. The server
2. PostgreSQL
3. Redis
4. Nginx

## Populate .env file

Navigate to `server` directory and run

```
cp .env.example .env
```

Then populate the value in there.

To start, run

```bash
docker-compose -f ./server/docker-compose.yml up
```

To force rebuild node modules after installing new packages

```bash
docker-compose -f ./server/docker-compose.yml up --build -V
```

The server will be running at `http://your-ip:2283` through `Nginx`

## Register User

Use the command below on your terminal to create user as we don't have user interface for this function yet.

```bash
curl --location --request POST 'http://your-server-ip:2283/auth/signUp' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "testuser@email.com",
    "password": "password"
}'
```

## Run mobile app

### Android

Download `apk` in release tab and run on your phone. You can follow this guide on how to do that

- [Run APK on Android](https://www.lifewire.com/install-apk-on-android-4177185)

### iOS

- Get a MacOS
- Download and setup Flutter development environment
- Navigate to `mobile` folder
- Run with release build command for best performance.

```bash
flutter run --release
```

# Known Issue

TensorFlow doesn't run with older CPU architecture, it requires CPU with AVX and AVX2 instruction set. If you encounter the error `illegal instruction core dump` when running the docker-compose command above, check for your CPU flags with the command and make sure you see `AVX` and `AVX2`. Otherwise, switch to a different VM/desktop with different architecture.

```bash
more /proc/cpuinfo | grep flags
```

If you are running virtualization in Promox, the VM doesn't have the flag enable.

You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.

`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`
