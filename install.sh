echo "Starting Immich installation..."

ip_address=$(hostname -I | awk '{print $1}')

immich_has() {
  type "$1" >/dev/null 2>&1
}

create_immich_directory() {
  echo "Creating Immich directory..."
  mkdir -p ./immich-app/immich-data
}

download_docker_compose_file() {
  echo "Downloading docker-compose.yml..."
  curl -L https://raw.githubusercontent.com/immich-app/immich/main/docker/docker-compose.yml -o ./immich-app/docker-compose.yml >/dev/null 2>&1
}

download_dot_env_file() {
  echo "Downloading .env file..."
  curl -L https://raw.githubusercontent.com/immich-app/immich/main/docker/.env.example -o ./immich-app/.env >/dev/null 2>&1
}

populate_upload_location() {
  echo "Populating default UPLOAD_LOCATION value..."
  cd ./immich-app/immich-data
  local upload_location=$(pwd)
  # Replace value of UPLOAD_LOCATION in .env with upload_location path
  sed -i "s|UPLOAD_LOCATION=.*|UPLOAD_LOCATION=$upload_location|" ../.env
  cd ..
}

populate_server_endpoint() {
  echo "Populating server endpoint..."

  if [[ "$OSTYPE" == "darwin"* ]]; then
    ip_address=$(ipconfig getifaddr en0)
  else
    ip_address=$(hostname -I | awk '{print $1}')
  fi

  # Replace value of VITE_SERVER_ENDPOINT
  sed -i "s|VITE_SERVER_ENDPOINT=.*|VITE_SERVER_ENDPOINT=http://$ip_address/api|" ./.env
}

# MAIN
create_immich_directory
download_docker_compose_file
download_dot_env_file
populate_upload_location
populate_server_endpoint
