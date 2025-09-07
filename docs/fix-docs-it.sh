#!/bin/bash

SRC_DIR="./docs"
IT_DIR="./docs/i18n/it/docusaurus-plugin-content-docs/current"

echo "=== Correzione link Markdown ==="
find "$IT_DIR" -type f \( -name "*.md" -o -name "*.mdx" \) | while read -r file; do
    cp "$file" "$file.bak"
    sed -i 's|\(/docs/\)|../|g' "$file"
    sed -i 's|\(docs/\)|../|g' "$file"
    echo "Aggiornato $file"
done

echo "=== Copia immagini mancanti ==="
find "$IT_DIR" -type f \( -name "*.md" -o -name "*.mdx" \) | while read -r file; do
    grep -oE '!\[[^\]]*\]\([^)]+\)' "$file" | grep -oE '\([^)]+\)' | tr -d '()' | while read -r img_path; do
        if [[ ! "$img_path" =~ ^http ]]; then
            full_it="$IT_DIR/$img_path"
            full_src="$SRC_DIR/${img_path#/docs/}"
            if [ ! -f "$full_it" ] && [ -f "$full_src" ]; then
                mkdir -p "$(dirname "$full_it")"
                cp "$full_src" "$full_it"
                echo "📄 Copiato immagine $img_path"
            elif [ ! -f "$full_it" ]; then
                echo "⚠️  Immagine mancante $img_path"
            fi
        fi
    done
done

echo "=== Fine ==="