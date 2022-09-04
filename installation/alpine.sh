#/bin/ash

# All-in-one installation without Docker

immich_ver=1.26.0_36-dev
alpine_ver=3.14

tmp_dir=/tmp

# see parse_args()
# [0|1]
dev=0

# $@: args from cli
parse_args()
{
    if [ "$1" == "--dev" ]
    then
        # Instead of downloading code from a release,
        # the source code is provided.
        dev=1
    elif [ "$1" == "-h" ]
    then
        echo "Dockerless installation script."
        echo "usage: $0 [--dev|-h]"
        echo
        echo "  -h      Show this help message"
        echo "  --dev   Run in dev mode"
        echo
        exit 0
    fi
}

# $1: message to print
display_message_box()
{
    # Calculate message and box width
    message_length=$(echo -n "$1" | wc -c)
    width=$((message_length + 4))

    # Leave if message is empty
    if [ -z "$message_length" ]
    then
        return 1
    fi

    echo

    # Print top box row
    for i in $(seq ${width})
    do
        echo -n "#"
    done
    echo

    # Print message with borders
    echo -n "# "; echo -n "$1" ; echo " #"

    # Print bottom box row
    for i in $(seq ${width})
    do
        echo -n "#"
    done
    echo
}

update_repo()
{
    # Enable community repository if not already enabled
    if ! grep -qE '^http.*\/community' /etc/apk/repositories
    then
        echo "Adding Alpine community repository..."
        echo "http://dl-cdn.alpinelinux.org/alpine/v${alpine_ver}/community" >> /etc/apk/repositories
    fi

    # Update packages list and install NodeJS
    echo "Updating packages list..."
    apk update
}

get_source_code()
{
    # If not in dev mode
    if [ "$dev" -eq 0 ]
    then
        # Download and extract repo release
        echo "Downloading and extracting Immich v$immich_ver..."
        wget https://github.com/immich-app/immich/archive/refs/tags/v${immich_ver}.tar.gz -O ${tmp_dir}/immich-${immich_ver}.tar.gz || exit
        tar -xzf ${tmp_dir}/immich-${immich_ver}.tar.gz --directory ${tmp_dir}
    else
        # Dev source code must be in temp directory
        echo "Getting source code from local directory..."
        if [ ! -d "$tmp_dir/immich-$immich_ver" ]
        then
            echo "You need to put $immich_ver development code in $tmp_dir/immich-$immich_ver/".
            exit 1
        fi
    fi
}

# PostgreSQL
setup_database()
{
    display_message_box "Database"

    # Inputs
    while [[ ! "$install_db" = [1-2] ]]; do
        read -p "Do you want to install database locally (1) or connect to an existing one (2 - not implemented): " install_db
    done
    read -p "Database username: " username
    read -p "Database's user password: " -s password
    echo
    read -p "Database's name: " db_name
    echo

    # Install DB or connect to an existing one
    if [ "$install_db" -eq "1" ]
    then
        psql_filename=immich.sql

        # postgresql-contrib used next to create the extension
        echo "Installing..."
        apk add postgresql postgresql-contrib
        echo "Starting on boot..."
        rc-update add postgresql
        echo "Starting..."
        /etc/init.d/postgresql start

        # Generate config file which sets user password and create database and extension
        # in a temp file.
        # The "uuid-ossp" extension is needed for the "uuid_generate_v4" function.
        echo -e "\
ALTER USER $username PASSWORD '$password';
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE DATABASE $db_name;
        " > ${tmp_dir}/${psql_filename}

        # Execute config file through postgres user, then remove the config file
        echo "Executing some SQL requests..."
        su - postgres -c "psql -f ${tmp_dir}/${psql_filename}"
        rm -f ${tmp_dir}/${psql_filename}

        # Write DB server address to local hosts file
        echo "Writing host address..."
        echo -e "127.0.0.1\timmich_postgres" >> /etc/hosts
    else
        # Ask for DB server address, then write it to hosts file
        read -p "Database address: " db_addr
        echo "Writing host address..."
        echo -e "$db_addr\timmich_postgres" >> /etc/hosts

        # ...
        # Need to execute SQL request remotely
        # Do we connect to a privilegied account (to set password and create database),
        # or do we connect to a standard user with already configured DB and rights?
    fi

    # Write persisting environment variables
    echo "Setting some environment variables..."
    echo "export DB_USERNAME=$username" >> /etc/profile.d/node.sh
    echo "export DB_PASSWORD=$password" >> /etc/profile.d/node.sh
    echo "export DB_DATABASE_NAME=$db_name" >> /etc/profile.d/node.sh
}

# Redis server
setup_redis()
{
    display_message_box "Redis"

    echo "Installing..."
    apk add redis
    echo "Starting on boot..."
    rc-update add redis
    echo "Starting..."
    /etc/init.d/redis start

    echo "Writing host address..."
    echo -e "127.0.0.1\timmich_redis" >> /etc/hosts
}



# main()
display_message_box "Immich v$immich_ver installation script for Alpine $alpine_ver"
parse_args "$@"
update_repo
get_source_code
setup_redis
setup_database
display_message_box "Immich is now accessible from 0.0.0.0:80!"
