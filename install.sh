#!/usr/bin/env bash
set -o nounset
set -o pipefail

# Portable in-place sed:
# - GNU sed: sed -i -e 's/.../.../' file
# - BSD/macOS sed: sed -i '' -e 's/.../.../' file
sed_in_place() {
  local expr="$1"
  local file="$2"

  # GNU sed supports `--version`; BSD/macOS sed does not.
  if sed --version >/dev/null 2>&1; then
    sed -i -e "$expr" "$file"
  else
    sed -i '' -e "$expr" "$file"
  fi
}

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
  # If there is already a pre-existing .env, do not overwrite it.
  # This makes reruns safe for users who have customized settings.
  if [[ -f ./.env ]]; then
    echo "Found existing .env, leaving it unchanged"
    return 0
  fi
  "${Curl[@]}" "$RepoUrl"/example.env -o ./.env
}

# Safer, Mac-safe
gen_password() {
  # Generate exactly 10 alphanumeric characters for DB_PASSWORD.
  # Preference order:
  #   1) openssl: available on most systems, good entropy
  #   2) shasum: macOS-friendly fallback
  #   3) sha256sum: common on Linux
  #
  # Notes:
  # - We strip to [A-Za-z0-9] to avoid quoting/escaping surprises in .env.
  # - We ensure the function always outputs 10 chars, or fails.

  local pw

  if command -v openssl >/dev/null 2>&1; then
    pw="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 10)"
  elif command -v shasum >/dev/null 2>&1; then
    pw="$(printf '%s' "$RANDOM$(date)$RANDOM" | shasum -a 256 | awk '{print $1}' | tr -dc 'A-Za-z0-9' | head -c 10)"
  elif command -v sha256sum >/dev/null 2>&1; then
    pw="$(printf '%s' "$RANDOM$(date)$RANDOM" | sha256sum | awk '{print $1}' | tr -dc 'A-Za-z0-9' | head -c 10)"
  else
    # Very last-resort fallback. Not cryptographically strong, but better than failing installs.
    pw="postgres${RANDOM}${RANDOM}"
    pw="$(printf '%s' "$pw" | tr -dc 'A-Za-z0-9' | head -c 10)"
  fi

  # If something went wrong, fail fast so the caller can handle it.
  if [[ -z "${pw}" || "${#pw}" -ne 10 ]]; then
    return 1
  fi

  printf '%s' "$pw"
}

generate_random_password() {
  echo "Generate random password for .env file..."
  local rand_pass
  rand_pass="$(gen_password)" || return 1
  if ! grep -q '^DB_PASSWORD=postgres$' "./.env"; then
    echo "DB_PASSWORD already set, leaving it unchanged"
    return 0
  fi
  sed_in_place "s/^DB_PASSWORD=postgres$/DB_PASSWORD=${rand_pass}/" "./.env"
}

start_docker_compose() {
  echo "Starting Immich's docker containers"
  if ! docker compose version >/dev/null 2>&1; then
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
  # If length of ip_address is 0, then we are on a Mac
  if [ ${#ip_address} -eq 0 ]; then
    ip_address=$(ipconfig getifaddr en0)
  fi
  cat <<EOF
Successfully deployed Immich!
You can access the website or the mobile app at http://$ip_address:2283
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
