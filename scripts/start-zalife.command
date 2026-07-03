#!/bin/bash
# =============================================================================
# ZaLife Daily OS — zagonska datoteka (launcher)
# Zažene lokalni strežnik in samodejno odpre aplikacijo v brskalniku.
# Dvoklikni to datoteko (ali bližnjico na namizju) za zagon.
# =============================================================================

PROJECT_DIR="/Users/alenradi/Desktop/zalife daily os"
URL="http://localhost:5173/"

cd "$PROJECT_DIR" || {
  echo "❌ Projekt ni najden: $PROJECT_DIR"
  read -n 1 -s -r -p "Pritisni katero koli tipko za izhod..."
  exit 1
}

# Node / npm preverjanje
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm ni nameščen. Najprej namesti Node.js: https://nodejs.org"
  read -n 1 -s -r -p "Pritisni katero koli tipko za izhod..."
  exit 1
fi

# Ob prvem zagonu namesti odvisnosti
if [ ! -d node_modules ]; then
  echo "📦 Prvi zagon: nameščam odvisnosti (lahko traja minuto)..."
  npm install || {
    read -n 1 -s -r -p "Namestitev ni uspela. Pritisni tipko za izhod..."
    exit 1
  }
fi

echo "🚀 Zaganjam ZaLife Daily OS ..."
echo "   Aplikacija se bo odprla v brskalniku. To okno pusti odprto."
echo "   Za zaustavitev strežnika zapri to okno ali pritisni Ctrl+C."
echo ""

# Odpri brskalnik, ko se strežnik odzove (preveri do 30s)
(
  for _ in $(seq 1 30); do
    if curl -s "$URL" >/dev/null 2>&1; then
      open "$URL"
      break
    fi
    sleep 1
  done
) &

npm run dev
