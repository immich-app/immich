#/bin/ash

# All-in-one installation without Docker

immich_ver=1.28.0_38-dev
alpine_ver=3.14

tmp_dir=/tmp

# see parse_args()
# [0|1]
dev=0
install=0
upgrade=0
uninstall=0

# Parse arguments given to the script from the CLI.
# Show help message, run installation and run install in dev mode.
#
# params:
# - $@: args from cli
#
# return: 
# - exit 0 if shows help message
parse_args()
{
    echo "Immich installation script." 

    if [ "$1" == "--install" ]
    then
	if [ "$2" == "-h" ]
        then
            echo "usage: $0 --install [--dev|-h]"        
            echo                                           
            echo "  -h              Show this help message"
            echo "  --dev           Run in dev mode"
            echo  
            exit 0
        fi

        # Instead of downloading code from a release,
        # the source code is provided.
        if [ "$2" == "--dev" ]
        then
            dev=1
	fi

	install=1
    elif [ "$1" == "--upgrade" ]
    then
        if [ "$2" == "-h" ]
        then
            echo "usage: $0 --upgrade [--dev|-h]"        
            echo "NB: medias and database are untouched."                                          
            echo                                           
            echo "  -h              Show this help message"
            echo "  --dev           Run in dev mode"
            echo  
            exit 0
        fi

        # Instead of downloading code from a release,
        # the source code is provided.
        if [ "$2" == "--dev" ]
        then
            dev=1
	fi

	upgrade=1
    elif [ "$1" == "--uninstall" ]
    then
        if [ "$2" == "-h" ]
        then
            echo "usage: $0 --uninstall [-h]"        
            echo "NB: medias and database are untouched."                                          
            echo                                           
            echo "  -h              Show this help message"
            echo  
            exit 0
        fi
	uninstall=1
    else
        echo "usage: $0 [--install|--upgrade [--dev]] [--uninstall] [-h]"
        echo                                           
        echo "  --install       Install Immich"
        echo "  --upgrade	Upgrade Immich"
        echo "  --dev           Run in dev mode"
        echo "  --uninstall     Remove Immich (without medias nor database)"
        echo "  -h              Show this help message"
        echo                                         
        exit 0
    fi
}

# Shows a message in a box, which looks like:
#
# ###########
# # Message #
# ###########
#
# params:
# - $1: message to print
#
# return:
# - '1' if message is empty 
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

# Check OS and version are supported.
#
# params: nothing
#
# return:
# - exit 1 if OS isn't supported
# - exit 2 OS version isn't supported
check_os()
{
	os_ver_file=/etc/alpine-release

	if [ ! -e "$os_ver_file" ]
	then
		echo "OS not supported! Please run it on Alpine Linux."
		exit 1
	fi

	if ! grep -qE "^$alpine_ver" "$os_ver_file"
	then
		echo "Alpine $(cat $os_ver_file) not supported: need Alpine $alpine_ver."
		exit 2
	fi
}

# Run all installation steps.
#
# params: nothing
#
# return: nothing
install()
{
	echo "Starting installation process..."
	update_repo
	get_source_code
	setup_redis
	setup_database
	setup_server
	setup_web
	setup_proxy
	#setup_machine_learning
	remove_install_files
	
	display_message_box "Immich is now accessible from 0.0.0.0:80!"
}

# Save environment variables used for server setup,
# uninstall current Immich and install the new one.
#
# params: nothing
#
# return: nothing
upgrade()
{
	echo "Starting upgrade process..."
	echo "NB: all medias and database will be kept."

	# Download the new release
	update_repo
	get_source_code
	
	# Load env variables
	source /etc/profile

	# Store variables in a tmp file, which will autocomplete
	# inputs at installation.
	# Server
	echo "$JWT_SECRET" > "$tmp_dir/immich-server-vars"
	echo "$ENABLE_MAPBOX" >> "$tmp_dir/immich-server-vars"
	[ "$ENABLE_MAPBOX" == "true" ] && echo "$MAPBOX_KEY" >> "$tmp_dir/immich-server-vars"
	echo "$UPLOAD_LOCATION" >> "$tmp_dir/immich-server-vars"

	# Uninstall current version
	uninstall

	echo "Rebuilding Immich components..."
	setup_server < "$tmp_dir/immich-server-vars"
	setup_web
	setup_proxy
	#setup_machine_learning
	
	# Remove installation files and copied variables
	remove_install_files
	rm -f "$tmp_dir/immich-server-vars"

	display_message_box "Immich upgraded, see 0.0.0.0:80!"
}

# Uninstall Immich components,
# without database nor medias.
#
# params: nothing
#
# return: nothing
uninstall()
{
	echo "Starting uninstallation process..."
	echo "NB: all medias and database will be kept."
	
	# Stop services
	/etc/init.d/immich-server stop
	/etc/init.d/immich-microservices stop
	/etc/init.d/immich-web stop
	#/etc/init.d/immich-machine-learning stop

	# Disable services from boot
	rc-update del immich-server
	rc-update del immich-microservices
	rc-update del immich-web
	#rc-update del immich-machine-learning

	# Remove services
	rm -f /etc/init.d/immich-*

	# Clean proxy
	rm -f /etc/nginx/http.d/nginx.conf
	/etc/init.d/nginx restart

	# Remove Immich
	rm -rf /usr/src/server
	rm -rf /usr/src/microservices
	rm -rf /usr/src/web
	#rm -rf /usr/src/machine-learning

	# Remove hosts
	sed -i "/immich[-_]/d" /etc/hosts

	# Remove environment variables
	rm -f /etc/profile.d/node.sh
	source /etc/profile
	unset JWT_SECRET ENABLE_MAPBOX MAPBOX_KEY REDIS_PORT REDIS_DBINDEX REDIS_PASSWORD REDIS_SOCKET DB_USERNAME DB_PASSWORD DB_DATABASE_NAME DB_PORT

	# Delete node user
	deluser node

	display_message_box "Immich successfully uninstalled!"
}

# Add Alpine community repo and update packages list.
#
# params: nothing
#
# return: nothing
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

# Fetch source code needed for the project's building.
# If the script runs in dev mode, the source code must be
# in $tmp_dir diretory. Else, the code is downloaded from GitHub.
#
# params: nothing
#
# return: 
# - exit 1 if dev mode but no source code in tmp path
get_source_code()
{
    # If not in dev mode
    if [ "$dev" -eq 0 ]
    then
        # Download and extract repo release
        echo "Downloading and extracting to Immich v$immich_ver..."
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

# Immich server
# Install Immich server and microservices.
# It asks for informations, builds and installs project, 
# create a service file and add the machine in hosts list.
#
# params: nothing
#
# return:
# - exit if cannot cd in the project directory
# - return if cannot cd ~
setup_server()
{
    display_message_box "Server & microservices"

    echo "Creating installation directory..."
    mkdir -p /usr/src/server
    cd /usr/src/server || exit

    # New user with a homedir
    echo "Creating 'node' user..."
    adduser -Dh /usr/src node

    # Create log directory
    mkdir -p /var/log/immich
    chown -R node:node /var/log/immich

    # Build stage
    echo "Installing build stage dependencies..."
    apk add --no-cache build-base python3 libheif vips-dev ffmpeg nodejs-current npm

    # Import package and package-lock.json
    echo "Installing..."
    cp ${tmp_dir}/immich-${immich_ver}/server/package*.json .
    chown -R node:node .
    unset NODE_ENV
    su node -c "npm ci"

    # Import anything else
    echo "Building package..."
    cp -r ${tmp_dir}/immich-${immich_ver}/server/* .
    chown -R node:node .
    su node -c "npm run build"

    # Production stage
    # Clean up installed packages used for build stage
    echo "Cleaning up build dependencies and add production deps..."
    apk del build-base python3 vips-dev
    apk add --no-cache vips

    # Clean now useless files
    echo "Removing files used for build stage..."
    rm -rf "$(ls | grep -v 'node_modules\|dist\|package*.json\|start*.sh')"

    echo "Removing extra packages..."
    su node -c "npm prune --production"

    # Then, environment variables are written for node execution
    echo "Getting some variables..."

    echo "export NODE_ENV=production" >> /etc/profile.d/node.sh

    # Get JWT secret.
    # If empty, it generates a random one.
    read -p "JWT Secret [empty for randomly generated]: " jwt_secret
    if [ -z "$jwt_secret" ]
    then
        jwt_secret=$(head -c 32 /dev/urandom | sha256sum | cut -d ' ' -f 1)
        echo "Generated JWT secret: $jwt_secret"
        echo
    fi
    echo "export JWT_SECRET=$jwt_secret" >> /etc/profile.d/node.sh

    # If user wants to use Mapbox
    read -p "Enable Mapbox [y/N]: " enable_mapbox
    if [ "$enable_mapbox" == "y" ] || [ "$enable_mapbox" == "true" ]
    then
        enable_mapbox=true
    else
        enable_mapbox=false
    fi
    echo "export ENABLE_MAPBOX=$enable_mapbox" >> /etc/profile.d/node.sh

    # If wants to use Mapbox, get the key
    if [ "$enable_mapbox" == "true" ]
    then
        read -p "Mapbox key: " mapbox_key
    fi
    echo "export MAPBOX_KEY=$mapbox_key" >> /etc/profile.d/node.sh

    # Where to store data
    while [ ! -d "$upload_path" ]
    do
        read -p "Full path where medias will be stored: " upload_path
    done
    ln -s "$upload_path" ./upload
    chown -R node:node ./upload
    echo "export UPLOAD_LOCATION=$upload_path" >> /etc/profile.d/node.sh

    # Load new variables
    echo "Loading new variables...."
    source /etc/profile

    # Scripts permissions
    chmod u+x ./start-server.sh ./start-microservices.sh

    # Write service file
    echo "Writing services files..."
    cp ${tmp_dir}/immich-${immich_ver}/installation/services/openrc/immich-server /etc/init.d/
    cp ${tmp_dir}/immich-${immich_ver}/installation/services/openrc/immich-microservices /etc/init.d/
    chmod +x /etc/init.d/immich-server /etc/init.d/immich-microservices

    # Enable service to start on boot
    echo "Starting server on boot..."
    rc-update add immich-server
    echo "Starting microservices on boot..."
    rc-update add immich-microservices

    # Start
    echo "Starting server..."
    /etc/init.d/immich-server start
    echo "Starting microservices..."
    /etc/init.d/immich-microservices start

    # Write server address to local hosts file
    echo "Writing hosts addresses..."
    echo -e "127.0.0.1\timmich-server" >> /etc/hosts
    echo -e "127.0.0.1\timmich-microservices" >> /etc/hosts

    cd ~ || return
}

# Immich web
# Install Immich web server.
# It installs dependencies, builds and installs project, 
# create a service file and add the machine in hosts list.
#
# params: nothing
#
# return:
# - exit if cannot cd in the project directory
# - return if cannot cd ~
setup_web()
{
    display_message_box "Web"

    echo "Creating installation directory..."
    mkdir -p /usr/src/web
    cd /usr/src/web || exit

    # New user with a homedir
    echo "Creating 'node' user..."
    adduser -Dh /usr/src node

    # Create log directory
    mkdir -p /var/log/immich
    chown -R node:node /var/log/immich

    echo "Installing build stage dependencies..."
    apk add --no-cache setpriv nodejs-current npm

    # Import package and package-lock.json
    cp ${tmp_dir}/immich-${immich_ver}/web/package*.json .
    chown -R node:node .

    echo "Installing..."
    # Unset env var for compilation, crash if not removed
    unset NODE_ENV
    su node -c "npm ci"

    # Import anything else
    cp -r ${tmp_dir}/immich-${immich_ver}/web/* .
    chown -R node:node .

    echo "Building package..."
    su node -c "npm run build"
    export NODE_ENV=production

    # Edit app directory, from /usr/src/app -> /usr/src/web
    sed -i "s/usr\/src\/app/usr\/src\/web/" entrypoint.sh
    chmod u+x ./entrypoint.sh

    # Write service file
    echo "Writing service file..."
    cp ${tmp_dir}/immich-${immich_ver}/installation/services/openrc/immich-web /etc/init.d/
    chmod +x /etc/init.d/immich-web

    # Enable service
    echo "Starting on boot..."
    rc-update add immich-web

    # Start
    echo "Starting..."
    /etc/init.d/immich-web start

    # Write web service address to local hosts file
    echo "Writing host address..."
    echo -e "127.0.0.1\timmich-web" >> /etc/hosts

    cd ~ || return
}

# Disabled, Alpine doesn't support TensorFlow.
# Error is "__memcpy_chk: symbol not found" at runtime.
#
# Install Immich machine learning.
# It checks for CPU compatibility, builds and installs the project.
#
# params: nothing
#
# return:
# - if CPU doesn't support AVX2 instructions
# - exit if cannot cd in project's directory
# - return if cannot cd in homedir
setup_machine_learning()
{
    display_message_box "Machine learning"

    echo "Check if CPU supports AVX2 instructions..."
    if ! grep -q avx2 /proc/cpuinfo
    then
        echo "Your CPU doesn't support AVX2 instructions!"
        echo "Please check README at https://github.com/immich-app/immich"
        echo "Ignoring ML..."
        return
    fi

    echo "Creating installation directory..."
    mkdir /usr/src/machine-learning
    cd /usr/src/machine-learning || exit

    # New user with a homedir
    echo "Creating 'node' user..."
    adduser -Dh /usr/src node

    # Create log directory
    mkdir -p /var/log/immich
    chown -R node:node /var/log/immich

    # Build stage
    cp ${tmp_dir}/immich-${immich_ver}/machine-learning/package*.json .

    echo "Installing build stage dependencies..."
    apk add gcc g++ make cmake python3 py3-pip ffmpeg nodejs-current npm

    echo "Installing..."
    unset NODE_ENV
    su node -c "npm ci"
    su node -c "npm rebuild @tensorflow/tfjs-node --build-from-source"

    echo "Building package..."
    cp -r ${tmp_dir}/immich-${immich_ver}/machine-learning/* .
    chown -R node:node .
    su node -c "npm run build"
    export NODE_ENV=production

    # Production stage
    echo "Cleaning up build dependencies..."
    apk del gcc g++ make cmake python3 py3-pip

    # Clean now useless files
    echo "Removing files used for build stage..."
    rm -rf "$(ls | grep -v 'node_modules\|dist\|package*.json\|entrypoint.sh')"

    echo "Removing extra packages..."
    su node -c "npm prune --production"

    # Where data will be stored.
    # Follow symlink created during server installation
    su node -c "ln -s ../server/upload ./upload"

    chmod u+x ./entrypoint.sh

    # Write service file
    echo "Writing service file..."
    cp ${tmp_dir}/immich-${immich_ver}/installation/services/openrc/immich-machine-learning /etc/init.d/
    chmod +x /etc/init.d/immich-machine-learning

    # Enable service
    echo "Starting on boot..."
    rc-update add immich-machine-learning

    # Start
    echo "Starting..."
    /etc/init.d/immich-machine-learning start

    # Write machine-learning server address to local hosts file
    echo "Writing host address..."
    echo -e "127.0.0.1\timmich-machine-learning" >> /etc/hosts

    cd ~ || return
}

# PostgreSQL
# Installs and initialize PostgreSQL DB.
#
# params: nothing
#
# return: 
# - exit 1 if cannot connect to the external DB
setup_database()
{
    display_message_box "Database"

    # Inputs
    while [[ ! "$install_db" = [1-2] ]]; do
        read -p "Do you want to install database locally (1) or connect to an existing one (2): " install_db
    done
    read -p "Database username: " username
    read -p "Database's user password: " -s password
    echo
    read -p "Database's name: " db_name

    # Install DB or connect to an existing one
    if [ "$install_db" -eq "1" ]
    then
	# Contains temp SQL queries, see below
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
        read -p "Database port [5432]: " db_port
        
	# Set default values
	if [ -z "$db_port" ]
	then
	    db_port=5432
	fi

	# Binary 'pq_isready' used below to test connection
	apk add postgresql-client

	# Test connection and exit if it fails
	echo "Testing connection to the database..."
	if ! pg_isready -q --host="$db_addr" --port="$db_port" --dbname="$db_name" --username="$username"
	then
		echo "Cannot connect to the database!"
		echo "Please verify that:"
		echo "- remote PostgreSQL server is listening on external connections"
		echo "- database has been created"
		echo "- user can read and edit the database"
		echo "- there are no blocking firewall rules"	
		echo "- credentials are right"

		exit 1
	fi

        echo "Writing host address..."
        echo -e "$db_addr\timmich_postgres" >> /etc/hosts
    fi

    # Write persisting environment variables
    echo "Setting some environment variables..."
    echo "export DB_USERNAME='$username'" >> /etc/profile.d/node.sh
    echo "export DB_PASSWORD='$password'" >> /etc/profile.d/node.sh
    echo "export DB_DATABASE_NAME='$db_name'" >> /etc/profile.d/node.sh
    echo "export DB_PORT='$db_port'" >> /etc/profile.d/node.sh
}

# Install Redis
#
# params: nothing
#
# return: nothing
setup_redis()
{
    display_message_box "Redis"

    # Inputs
    while [[ ! "$install_redis" = [1-2] ]]; do
        read -p "Do you want to install Redis locally (1) or connect to an existing one (2): " install_redis
    done

    # Install Redis or connect to an existing one
    if [ "$install_redis" -eq "1" ]
    then
	echo "Installing..."
	apk add redis
	echo "Starting on boot..."
	rc-update add redis
	echo "Starting..."
	/etc/init.d/redis restart

        # Write Redis server address to local hosts file
        echo "Writing host address..."
        echo -e "127.0.0.1\timmich_redis" >> /etc/hosts
    else
        # Ask for many Redis data
        read -p "Redis address: " redis_addr
        read -p "Redis port [6379]: " redis_port
        read -p "Redis database index [0]: " redis_dbindex
        read -p "Redis password [none]: " redis_password
        read -p "Redis socket [none]: " redis_socket
	
	# Set default values for non edited variables
	if [ -z "$redis_port" ]
	then
	    redis_port=6379
	fi
	if [ -z "$redis_dbindex" ]
	then
	    redis_dbindex=0
	fi
	
	echo "Writing host address..."
        echo -e "$redis_addr\timmich_redis" >> /etc/hosts

	# Write persisting environment variables
	echo "Setting some environment variables..."
	echo "export REDIS_PORT='$redis_port'" >> /etc/profile.d/node.sh
	echo "export REDIS_DBINDEX='$redis_dbindex'" >> /etc/profile.d/node.sh
	[ "$redis_password" ] && echo "export REDIS_PASSWORD='$redis_password'" >> /etc/profile.d/node.sh
	[ "$redis_socket" ] && echo "export REDIS_SOCKET='$redis_socket'" >> /etc/profile.d/node.sh
    fi
}

# It installs Nginx, disable the default
# webpage and add the custom config.
#
# params: nothing
#
# return:
# - exit if cannot cd in project's directory
# - return if cannot go back to homedir
setup_proxy()
{
    display_message_box "Proxy"

    echo "Installing..."
    apk add nginx
    echo "Starting on boot..."
    rc-update add nginx

    cd /etc/nginx/http.d || exit

    # Disable all existing sites
    echo "Disabling existing sites..."
    for file in $(ls --hide=*.disable)
    do
        mv "$file" "$file.disable"
    done

    # Add new config
    echo "Adding new config..."
    cp ${tmp_dir}/immich-${immich_ver}/nginx/nginx.conf /etc/nginx/http.d/

    # Start service to apply the new config
    echo "Starting..."
    /etc/init.d/nginx restart

    echo "Writing host address..."
    echo -e "127.0.0.1\timmich_proxy" >> /etc/hosts

    cd ~ || return
}

# Remove installation files (mainly source code)
# downloaded from the script.
# If in dev mode, the code isn't erased.
#
# params: nothing
#
# return: nothing
remove_install_files()
{
    # Clean installation files (if not in debug)
    if [ "$dev" -eq 0 ]
    then
        echo "Removing installation files..."
        rm -rf ${tmp_dir}/*immich*
    fi
}


# main()
display_message_box "Immich v$immich_ver installation script for Alpine $alpine_ver"
parse_args "$@"
check_os
[ "$install" -eq 1 ] && install
[ "$uninstall" -eq 1 ] && uninstall
[ "$upgrade" -eq 1 ] && upgrade
