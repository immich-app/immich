#!/usr/bin/env bash
set -o nounset
set -o pipefail

create_immich_directory() { local -r Tgt='./immich-app'
  echo "Creating Immich directory..."
  if [[ -e "$Tgt" ]]; then
    echo "Found existing directory $Tgt, will overwrite YAML files"
  else
    mkdir "$Tgt" || return
  fi 
  cd "$Tgt" || return
}

download_docker_compose_file() {
  echo "Downloading docker-compose.yml..."
  "${Curl[@]}" "$RepoUrl"/docker-compose.yml -o ./docker-compose.yml
}

download_dot_env_file() {
  echo "Downloading .env file..."
  "${Curl[@]}" "$RepoUrl"/example.env -o ./.env
}

start_docker_compose() { local -a docker_bin
  echo "Starting Immich's docker containers"

  if docker compose >/dev/null 2>&1; then
    docker_bin=(docker compose)
  elif docker-compose >/dev/null 2>&1; then
    docker_bin=(docker-compose)
  else
    echo "Cannot find \`docker compose\` or \`docker-compose\`."
    return 1
  fi

  if ! "${docker_bin[@]}" up --remove-orphans -d; then
    echo "Could not start. Check for errors above."
    return 1
  fi
  show_friendly_message
}

show_friendly_message() {
  local ip_address
  ip_address=$(hostname -I | awk '{print $1}')
  cat << EOF
Successfully deployed Immich!
You can access the website at http://$ip_address:2283 and the server URL for the mobile app is http://$ip_address:2283/api
---------------------------------------------------
If you want to configure custom information of the server, including the database, Redis information, or the backup (or upload) location, etc. 
  
  1. First bring down the containers with the command 'docker-compose down' in the immich-app directory, 
  
  2. Then change the information that fits your needs in the '.env' file, 
  
  3. Finally, bring the containers back up with the command 'docker-compose up --remove-orphans -d' in the immich-app directory
EOF
}

# MAIN
main() {
  echo "Starting Immich installation..."
  local -ra Curl=(curl -fsSL)
  ! command -v curl >/dev/null && { echo 'no curl binary found; please install curl and try again'; return 1; }
  local -r RepoUrl='https://github.com/immich-app/immich/releases/latest/download'

  create_immich_directory || { echo 'error creating Immich directory'; return 10; }
  download_docker_compose_file || { echo 'error downloading Docker Compose file'; return 11; }
  download_dot_env_file || { echo 'error downloading .env'; return 12; }
  start_docker_compose || return 13
  return 0; }

main
exit
