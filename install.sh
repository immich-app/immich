#!/usr/bin/env bash
set -o nounset
set -o pipefail

create_immich_directory() {
  local -r Tgt='./immich-app'
  echo "Creating Immich directory..."
  if [[ -e $Tgt ]]; then
    echo "Found existing directory $Tgt, will overwrite YAML files"
  else
    mkdir "$Tgt" || return
  fi
  cd "$Tgt" || return 1
}

download_docker_compose_file() {
  echo "Downloading docker-compose.yml..."
  "${Curl[@]}" "$RepoUrl"/docker-compose.yml -o ./docker-compose.yml
}

download_dot_env_file() {
  echo "Downloading .env file..."
  "${Curl[@]}" "$RepoUrl"/example.env -o ./.env
}

generate_random_password() {
  echo "Generate random password for .env file..."
  rand_pass=$(echo "$RANDOM$(date)$RANDOM" | sha256sum | base64 | head -c10)
  if [ -z "$rand_pass" ]; then
    sed -i -e "s/DB_PASSWORD=postgres/DB_PASSWORD=postgres${RANDOM}${RANDOM}/" ./.env
  else
    sed -i -e "s/DB_PASSWORD=postgres/DB_PASSWORD=${rand_pass}/" ./.env
  fi
}

start_docker_compose() {
  echo "Starting Immich's docker containers"

  if ! docker compose >/dev/null 2>&1; then
    echo "failed to find 'docker compose'"
    return 1
  fi

  if ! docker compose up --remove-orphans -d; then
    echo "Could not start. Check for errors above."
    return 1
  fi
  show_friendly_message
}

show_friendly_message() {
  local ip_address
  ip_address=$(hostname -I | awk '{print $1}')
  cat <<EOF
Successfully deployed Immich!
You can access the website at http://$ip_address:2283 and the server URL for the mobile app is http://$ip_address:2283/api
---------------------------------------------------
If you want to configure custom information of the server, including the database, Redis information, or the backup (or upload) location, etc.

  1. First bring down the containers with the command 'docker compose down' in the immich-app directory,

  2. Then change the information that fits your needs in the '.env' file,

  3. Finally, bring the containers back up with the command 'docker compose up --remove-orphans -d' in the immich-app directory
EOF
}

# MAIN
main() {
  echo "Starting Immich installation..."
  local -r RepoUrl='https://github.com/immich-app/immich/releases/latest/download'
  local -a Curl
  if command -v curl >/dev/null; then
    Curl=(curl -fsSL)
  else
    echo 'no curl binary found; please install curl and try again'
    return 14
  fi

  create_immich_directory || {
    echo 'error creating Immich directory'
    return 10
  }
  download_docker_compose_file || {
    echo 'error downloading Docker Compose file'
    return 11
  }
  download_dot_env_file || {
    echo 'error downloading .env'
    return 12
  }
  generate_random_password
  start_docker_compose || {
    echo 'error starting Docker'
    return 13
  }
  return 0
}

main
Exit=$?
[[ $Exit == 0 ]] || echo "There was an error installing Immich. Exit code: $Exit. Please provide these logs when asking for assistance."
exit "$Exit"
