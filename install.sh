echo "Starting Immich installation..."

ip_address=$(hostname -I | awk '{print $1}')

RED='\033[0;31m'
GREEN='\032[0;31m'
NC='\033[0m' # No Color

machine_has() {
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

  upload_location=$(pwd)

  # Replace value of UPLOAD_LOCATION in .env with upload_location path
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|UPLOAD_LOCATION=.*|UPLOAD_LOCATION=$upload_location|" ../.env
  else
    sed -i "s|UPLOAD_LOCATION=.*|UPLOAD_LOCATION=$upload_location|" ../.env
  fi

  cd ..
}

populate_server_endpoint() {
  echo "Populating server endpoint..."

  if [[ "$OSTYPE" == "darwin"* ]]; then
    ip_address=$(ipconfig getifaddr en0)
    sed -i '' "s|VITE_SERVER_ENDPOINT=.*|VITE_SERVER_ENDPOINT=http://$ip_address:2283/api|" ./.env
  else
    ip_address=$(hostname -I | awk '{print $1}')
    sed -i "s|VITE_SERVER_ENDPOINT=.*|VITE_SERVER_ENDPOINT=http://$ip_address:2283/api|" ./.env
  fi
}

start_docker_compose() {
  echo "Starting Immich's docker containers"

  if machine_has "docker compose"; then {
    docker compose up --remove-orphans -d

    show_friendly_message
    exit 0
  }; fi

  if machine_has "docker-compose"; then
    docker-compose up --remove-orphans -d

    show_friendly_message
    exit 0
  fi
}

show_friendly_message() {
  echo "Succesfully deployed Immich!"
  echo "You can access the website at http://$ip_address:2283 and the server URL for the mobile app is http://$ip_address:2283/api"
  echo "The backup (or upload) location is $upload_location"
  echo "---------------------------------------------------"
  echo "If you want to confgure custom information of the server, including the database, Redis information, or the backup (or upload) location, etc."

  echo "Before updating the content of the configuration file, please bring down the containers with the command 'docker-compose down' in the immich-app directory, then change the information that fits your needs in the '.env' file, and then bring the containers back up with the command 'docker-compose up --remove-orphans -d' in the immich-app directory"
}

# MAIN
create_immich_directory
download_docker_compose_file
download_dot_env_file
populate_upload_location
populate_server_endpoint
start_docker_compose
