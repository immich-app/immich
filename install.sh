echo "Starting Immich installation..."

ip_address=$(hostname -I | awk '{print $1}')

release_version=$(curl --silent "https://api.github.com/repos/immich-app/immich/releases/latest" |
  grep '"tag_name":' |
  sed -E 's/.*"([^"]+)".*/\1/')
RED='\033[0;31m'
GREEN='\032[0;31m'
NC='\033[0m' # No Color

get_release_version() {
  curl --silent "https://api.github.com/repos/immich-app/immich/releases/latest" | # Get latest release from GitHub api
    grep '"tag_name":' |                                                           # Get tag line
    sed -E 's/.*"([^"]+)".*/\1/'                                                   # Pluck JSON value
}

create_immich_directory() {
  echo "Creating Immich directory..."
  mkdir -p ./immich-app/immich-data
  cd ./immich-app
}

download_docker_compose_file() {
  echo "Downloading docker-compose.yml..."
  curl -L https://raw.githubusercontent.com/immich-app/immich/$release_version/docker/docker-compose.yml -o ./docker-compose.yml >/dev/null 2>&1
}

download_dot_env_file() {
  echo "Downloading .env file..."
  curl -L https://raw.githubusercontent.com/immich-app/immich/$release_version/docker/example.env -o ./.env >/dev/null 2>&1
}

replace_env_value() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
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

generate_jwt_secret() {
  echo "Generating JWT_SECRET value..."
  jwt_secret=$(openssl rand -base64 128)
  replace_env_value "JWT_SECRET" $jwt_secret
}

start_docker_compose() {
  echo "Starting Immich's docker containers"

  if docker compose &>/dev/null; then
    docker_bin="docker compose"
  elif docker-compose &>/dev/null; then
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
  echo "Succesfully deployed Immich!"
  echo "You can access the website at http://$ip_address:2283 and the server URL for the mobile app is http://$ip_address:2283/api"
  echo "The backup (or upload) location is $upload_location"
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
generate_jwt_secret
start_docker_compose
