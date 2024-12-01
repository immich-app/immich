# Enable multiarch for arm64 if necessary
if [ "$(dpkg --print-architecture)" = "arm64" ]; then
    sudo dpkg --add-architecture amd64 && \
    sudo apt-get update && \
    sudo apt-get install -y --no-install-recommends \
        qemu-user-static \
        libc6:amd64 \
        libstdc++6:amd64 \
        libgcc1:amd64
fi

# Install DCM
wget -qO- https://dcm.dev/pgp-key.public | sudo gpg --dearmor -o /usr/share/keyrings/dcm.gpg
sudo echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | sudo tee /etc/apt/sources.list.d/dart_stable.list

sudo apt-get update
sudo apt-get install dcm

dart --disable-analytics

# Install immich
cd /immich
make install-all

