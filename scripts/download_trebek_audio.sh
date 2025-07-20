#!/bin/bash

# Script to download Alex Trebek audio files from 101soundboards
# Usage: ./download_trebek_audio.sh

# Create directory for audio files
AUDIO_DIR="assets/audio/trebek"
mkdir -p "$AUDIO_DIR"

echo "🎤 Downloading Alex Trebek audio files..."

# Base URL
BASE_URL="https://www.101soundboards.com"

# Get the page content and extract all audio URLs
echo "📡 Fetching audio URLs..."
AUDIO_URLS=$(curl -s "https://www.101soundboards.com/boards/48215-alex-trebek-jeopardy-voices-wii" | \
  grep -oE 'src="/storage/board_sounds_rendered/[^"]+\.mp3[^"]*"' | \
  sed 's/src="//;s/"$//' | \
  sed 's/&amp;/\&/g')

# Also extract the sound transcripts/names
SOUND_DATA=$(curl -s "https://www.101soundboards.com/boards/48215-alex-trebek-jeopardy-voices-wii" | \
  grep -oE 'sound_transcript\\":\\"[^"]+\\"' | \
  sed 's/sound_transcript\\":\\"//' | \
  sed 's/\\"//')

# Convert to arrays
IFS=$'\n' read -d '' -r -a urls <<< "$AUDIO_URLS"
IFS=$'\n' read -d '' -r -a names <<< "$SOUND_DATA"

# Download each audio file
total=${#urls[@]}
echo "📊 Found $total audio files to download"

for i in "${!urls[@]}"; do
  url="${urls[$i]}"
  # Extract filename from URL
  filename=$(echo "$url" | grep -oE '[0-9]+-[^.]+\.mp3' | head -1)
  
  # Create a more descriptive filename using the transcript if available
  if [ "${names[$i]}" != "" ]; then
    # Clean the transcript name for use as filename
    clean_name=$(echo "${names[$i]}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/_/g' | sed 's/__*/_/g' | sed 's/^_//;s/_$//')
    new_filename="${filename%.*}_${clean_name}.mp3"
  else
    new_filename="$filename"
  fi
  
  # Progress indicator
  progress=$((i + 1))
  echo "⬇️  [$progress/$total] Downloading: $new_filename"
  
  # Download the file
  curl -s -L "${BASE_URL}${url}" -o "${AUDIO_DIR}/${new_filename}"
  
  # Small delay to be respectful to the server
  sleep 0.5
done

echo "✅ Download complete! Files saved to: $AUDIO_DIR"
echo "📁 Total files downloaded: $(ls -1 "$AUDIO_DIR" | wc -l)"
echo ""
echo "🎯 You can now use these audio files for:"
echo "   - Training a voice model"
echo "   - Sound effects in the game"
echo "   - Creating audio mashups"
