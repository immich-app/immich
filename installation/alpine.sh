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


# main()
parse_args "$@"
