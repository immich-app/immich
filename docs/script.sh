#!/bin/bash

# Lista delle lingue da processare (esclude la default 'en')
LOCALES=("it" "fr" "de" "es" "pt" "ru" "zh-Hans" "ja" "ar")

SRC_DIR="./docs"   # <-- attenzione al percorso corretto

for LOCALE in "${LOCALES[@]}"; do
  TARGET="i18n/$LOCALE/docusaurus-plugin-content-docs/current"
  echo "📂 Elaborazione lingua $LOCALE → $TARGET"

  # Crea la cartella principale se non esiste
  mkdir -p "$TARGET"

  # Copia ricorsivamente tutto da SRC_DIR preservando sottocartelle
  cp -r "$SRC_DIR"/. "$TARGET"/
done

echo "✅ Tutti i docs copiati con struttura completa in i18n/<locale>"
