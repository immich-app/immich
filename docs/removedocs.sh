#!/bin/bash

# Cartella radice da cui partire
ROOT_DIR="i18n/it/docusaurus-plugin-content-docs/current"

# Trova tutti i file .md o .mdx e sostituisci /docs/ con ../
find "$ROOT_DIR" -type f \( -name "*.md" -o -name "*.mdx" \) | while read -r file; do
  echo "Modificando $file"
  sed -i 's|/docs/|../|g' "$file"
done

echo "Fatto!"
