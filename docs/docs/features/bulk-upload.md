# Bulk Upload (Using the CLI)

You can use the CLI to upload an existing gallery to the Immich server

[Immich CLI Repository](https://github.com/immich-app/CLI)

## Requirements

- Node.js 16 or above
- Npm

## Installation

```bash
npm i -g immich
```

## Quick Start

Specify user's credentials, Immich's server address and port, and the directory you would like to upload videos/photos from.

```bash
immich upload --key HFEJ38DNSDUEG --server http://192.168.1.216:2283/api -d your/target/directory
```

---

### Parameters

| Parameter        | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| --yes / -y       | Assume yes on all interactive prompts                               |
| --delete / -da   | Delete local assets after upload                                    |
| --key / -k       | User's API key                                                      |
| --server / -s    | Immich's server address                                             |
| --directory / -d | Directory to upload from                                            |
| --threads / -t   | Number of threads to use (Default 5)                                |
| --album/ -al     | Create albums for assets based on the parent folder or a given name |

### Obtain the API Key

The API key can be obtained in the user setting panel on the web interface.

![Obtain Api Key](./img/obtain-api-key.png)


### Run via Docker

Be aware that as this runs inside a container it mounts your current directory as a volume, and for the -d flag you need to use the path inside the container.

```bash
docker run -it --rm -v $(pwd):/import ghcr.io/immich-app/immich-cli:latest upload --key HFEJ38DNSDUEG --server http://192.168.1.216:2283/api -d /import
```

Optionally, you can create an alias:

```bash
alias immich="docker run -it --rm -v $(pwd):/import ghcr.io/immich-app/immich-cli:latest"
immich upload --key HFEJ38DNSDUEG --server http://192.168.1.216:2283/api -d /import
```

### Run from source

```bash title="Clone Repository"
git clone https://github.com/immich-app/CLI
```

```bash title="Install dependencies"
npm install
```

```bash title="Build the project"
npm run build
```

```bash title="Run the command"
node bin/index.js upload --key HFEJ38DNSDUEG --server http://192.168.1.216:2283/api -d your/target/directory
```
