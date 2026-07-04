set -e
echo "host replication ${REPLICATION_USERNAME} 0.0.0.0/0 scram-sha-256" >> "$PGDATA/pg_hba.conf"
