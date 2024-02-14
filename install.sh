echo "Starting Immich installation..."

ip_address=$(hostname -I | awk '{print $1}')

RED='\033[0;31m'
GREEN='\032[0;31m'
NC='\033[0m' # No Color

create_immich_directory() {
  echo "Creating Immich directory..."
  mkdir -p ./immich-app/immich-data
  cd ./immich-app
}

download_docker_compose_file() {
  echo "Downloading docker-compose.yml..."
  curl -L https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml -o ./docker-compose.yml >/dev/null 2>&1
}

download_dot_env_file() {
  echo "Downloading .env file..."
  curl -L https://github.com/immich-app/immich/releases/latest/download/example.env -o ./.env >/dev/null 2>&1
}

replace_env_value() {
  KERNEL="$(uname -s | tr '[:upper:]' '[:lower:]')"
  if [ "$KERNEL" = "darwin" ]; then
    sed -i '' "s|$1=.*|$1=$2|" ./.env
  else
    sed -i "s|$1=.*|$1=$2|" ./.env
  fi
}

populate_upload_location() {
  echo "Populating default UPLOAD_LOCATION value..."
  upload_location=$(pwd)/immich-data
  replace_env_value "UPLOAD_LOCATION" $upload_location
}

start_docker_compose() {
  echo "Starting Immich's docker containers"

  if docker compose > /dev/null 2>&1; then
    docker_bin="docker compose"
  elif docker-compose > /dev/null 2>&1; then
    docker_bin="docker-compose"
  else
    echo 'Cannot find `docker compose` or `docker-compose`.'
    exit 1
  fi

  if $docker_bin up --remove-orphans -d; then
    show_friendly_message
    exit 0
  else
    echo "Could not start. Check for errors above."
    exit 1
  fi
}

show_friendly_message() {
  echo "Successfully deployed Immich!"
  echo "You can access the website at http://$ip_address:2283 and the server URL for the mobile app is http://$ip_address:2283/api"
  echo "The library location is $upload_location"
  echo "---------------------------------------------------"
  echo "If you want to configure custom information of the server, including the database, Redis information, or the backup (or upload) location, etc. 
  
  1. First bring down the containers with the command 'docker-compose down' in the immich-app directory, 
  
  2. Then change the information that fits your needs in the '.env' file, 
  
  3. Finally, bring the containers back up with the command 'docker-compose up --remove-orphans -d' in the immich-app directory"

}

# MAIN
create_immich_directory
download_docker_compose_file
download_dot_env_file
populate_upload_location
start_docker_compose
