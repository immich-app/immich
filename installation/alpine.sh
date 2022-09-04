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


# main()
display_message_box "Immich v$immich_ver installation script for Alpine $alpine_ver"
parse_args "$@"
update_repo
display_message_box "Immich is now accessible from 0.0.0.0:80!"
