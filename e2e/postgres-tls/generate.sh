#!/usr/bin/env sh

rm .env

# For ROOT CA
openssl req -new -nodes -text -out root.csr -keyout root.key -subj "/CN=ROOTCA"
openssl x509 -req -in root.csr -sha256 -days 3650 -extensions v3_ca -signkey root.key -out root.crt

# For server certificate
openssl req -new -nodes -text -out server.csr -keyout server.key -subj "/CN=database"
openssl x509 -req -in server.csr -sha256 -days 365 -CA root.crt -CAkey root.key -CAcreateserial -out server.crt

# For client certificate
openssl req -new -nodes -text -out client.csr -keyout client.key -subj "/CN=CLIENT"
openssl x509 -req -in client.csr -sha256 -days 365 -CA root.crt -CAkey root.key -CAcreateserial -out client.crt

sudo chmod og-rwx root.key
sudo chown 999:999 root.key
sudo chmod og-rwx server.key
sudo chown 999:999 server.key
sudo chmod og-rwx client.key
sudo chown 999:999 client.key

# Generate dotenv file
cat <<EOF > .env
DB_TLS=true
DB_TLS_CA=$(sudo sed -z 's/\n/\\n/g' root.crt)
DB_TLS_CLIENT_CERT=$(sudo sed -z 's/\n/\\n/g' client.crt)
DB_TLS_CLIENT_KEY=$(sudo sed -z 's/\n/\\n/g' client.key)
POSTGRES_SSL_PARAMS="-c ssl=on -c ssl_cert_file=/tls/server.crt -c ssl_key_file=/tls/server.key -c ssl_ca_file=/tls/root.crt"
EOF
mv -f .env ../
