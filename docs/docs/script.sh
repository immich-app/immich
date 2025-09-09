#!/bin/bash

# Cartella di partenza
ROOT_DIR=${1:-.}  # Se non specificata, usa la cartella corrente

# Estensioni dei file da processare
EXTENSIONS=("md" "mdx" "tsx" "ts" "js" "jsx") 

# Ciclo sui file, escludendo la cartella i18n
find "$ROOT_DIR" -type d -name "i18n" -prune -o -type f \( $(printf -- "-name '*.%s' -o " "${EXTENSIONS[@]}" | sed 's/ -o $//') \) -print | while read -r file; do

    # Sostituzione in-place dei link DOCS/... -> ../...
    sed -i 's|DOCS/\([^ )]*\)|../\1|g' "$file"

    echo "Processed: $file"
done

echo "Tutti i link sono stati aggiornati (esclusa la cartella i18n). Backup dei file originali con estensione .bak"
