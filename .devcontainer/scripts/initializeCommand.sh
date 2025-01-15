#!/bin/bash

# If .env file does not exist, create it by copying example.env from the docker folder
if [ ! -f ".devcontainer/.env" ]; then
    cp docker/example.env .devcontainer/.env
fi
