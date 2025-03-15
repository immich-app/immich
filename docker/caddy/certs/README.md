## What is in this folder? 

These are Caddy certificates necessary for local development using the service-worker, clipboard access, etc. 

This folder contains certs root and intermediate CAs. Caddy uses this to sign its server certs.

These certificates have a 10yr expiration date. They should NOT be used in production. 

## How to use?
1. You should import these into your system keychain or truststore. (OS-specific)
2. Ensure 'immich-dev' resolves to the docker host.
    *  i.e. add entry in /etc/hosts that points to the host running the immich docker container. 

## Permissions
Caddy runs as root user. These files must be owned by root with 600 permissions. You make need to temporarily make these 644 so you can copy/import them into your trust store. 