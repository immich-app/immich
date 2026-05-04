#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANDING_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$BRANDING_DIR")"
EXIT_CODE=0

echo "=== Verifying mobile image assets ==="

if ! command -v identify &>/dev/null; then
  echo "  FAIL: ImageMagick identify is required to verify mobile image bounds"
  exit 1
fi

image_magick() {
  if command -v magick &>/dev/null; then
    magick "$@"
  elif command -v convert &>/dev/null; then
    convert "$@"
  else
    echo "  FAIL: ImageMagick magick or convert is required to verify mobile image bounds"
    exit 1
  fi
}

check_android12_splash_bounds() {
  local file="$1"
  local relative_file="${file#"$REPO_ROOT/"}"

  if [[ ! -f "$file" ]]; then
    echo "  FAIL: missing $relative_file"
    EXIT_CODE=1
    return
  fi

  local details width height bbox box_width box_height offset_x offset_y max_box max_box_slack max_offset_diff right_pad bottom_pad horizontal_delta vertical_delta
  details=$(identify -format "%w %h %@" "$file")
  read -r width height bbox <<<"$details"

  if [[ ! "$bbox" =~ ^([0-9]+)x([0-9]+)\+([0-9]+)\+([0-9]+)$ ]]; then
    echo "  FAIL: could not parse non-transparent bounds for $relative_file: $bbox"
    EXIT_CODE=1
    return
  fi

  box_width="${BASH_REMATCH[1]}"
  box_height="${BASH_REMATCH[2]}"
  offset_x="${BASH_REMATCH[3]}"
  offset_y="${BASH_REMATCH[4]}"
  max_box=$((width * 4 / 9))
  max_box_slack=2
  max_offset_diff=2
  right_pad=$((width - offset_x - box_width))
  bottom_pad=$((height - offset_y - box_height))
  horizontal_delta=$((offset_x > right_pad ? offset_x - right_pad : right_pad - offset_x))
  vertical_delta=$((offset_y > bottom_pad ? offset_y - bottom_pad : bottom_pad - offset_y))

  if (( box_width > max_box + max_box_slack || box_height > max_box + max_box_slack )); then
    echo "  FAIL: $relative_file content is ${box_width}x${box_height}; max is ${max_box}x${max_box}"
    EXIT_CODE=1
    return
  fi

  if (( horizontal_delta > max_offset_diff || vertical_delta > max_offset_diff )); then
    echo "  FAIL: $relative_file content is not centered (left=$offset_x right=$right_pad top=$offset_y bottom=$bottom_pad)"
    EXIT_CODE=1
    return
  fi

  echo "  OK: $relative_file content ${box_width}x${box_height} within ${max_box}x${max_box} target (+${max_box_slack}px resize slack)"
}

check_ios_app_icon_bounds() {
  local file="$1"
  local expected_size="$2"
  local relative_file="${file#"$REPO_ROOT/"}"

  if [[ ! -f "$file" ]]; then
    echo "  FAIL: missing $relative_file"
    EXIT_CODE=1
    return
  fi

  local details width height box_width box_height offset offset_x offset_y min_box max_offset_diff right_pad bottom_pad horizontal_delta vertical_delta
  details=$(image_magick "$file" -fuzz 1% -trim -format "%w %h %O" info:)
  read -r box_width box_height offset <<<"$details"

  width=$(identify -format "%w" "$file")
  height=$(identify -format "%h" "$file")

  if [[ "$width" != "$expected_size" || "$height" != "$expected_size" ]]; then
    echo "  FAIL: $relative_file is ${width}x${height}; expected ${expected_size}x${expected_size}"
    EXIT_CODE=1
    return
  fi

  if [[ ! "$offset" =~ ^\+([0-9]+)\+([0-9]+)$ ]]; then
    echo "  FAIL: could not parse trimmed bounds for $relative_file: $offset"
    EXIT_CODE=1
    return
  fi

  offset_x="${BASH_REMATCH[1]}"
  offset_y="${BASH_REMATCH[2]}"
  min_box=$((expected_size * 65 / 100))
  max_offset_diff=2
  right_pad=$((width - offset_x - box_width))
  bottom_pad=$((height - offset_y - box_height))
  horizontal_delta=$((offset_x > right_pad ? offset_x - right_pad : right_pad - offset_x))
  vertical_delta=$((offset_y > bottom_pad ? offset_y - bottom_pad : bottom_pad - offset_y))

  if (( box_width < min_box || box_height < min_box )); then
    echo "  FAIL: $relative_file content is ${box_width}x${box_height}; minimum is ${min_box}x${min_box}"
    EXIT_CODE=1
    return
  fi

  if (( horizontal_delta > max_offset_diff || vertical_delta > max_offset_diff )); then
    echo "  FAIL: $relative_file content is not centered (left=$offset_x right=$right_pad top=$offset_y bottom=$bottom_pad)"
    EXIT_CODE=1
    return
  fi

  echo "  OK: $relative_file content ${box_width}x${box_height} fills iOS icon target"
}

android12_splash_files=(
  "$REPO_ROOT/mobile/assets/immich-splash-android12.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-mdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-hdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-xhdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-xxhdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-xxxhdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-night-mdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-night-hdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-night-xhdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-night-xxhdpi/android12splash.png"
  "$REPO_ROOT/mobile/android/app/src/main/res/drawable-night-xxxhdpi/android12splash.png"
)

if [[ -f "$REPO_ROOT/branding/assets/splash-android12.png" ]]; then
  android12_splash_files+=("$REPO_ROOT/branding/assets/splash-android12.png")
fi

for file in "${android12_splash_files[@]}"; do
  check_android12_splash_bounds "$file"
done

for dir in \
  "$REPO_ROOT/branding/assets/mobile/ios/AppIcon" \
  "$REPO_ROOT/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset"; do
  if [[ -d "$dir" ]]; then
    for size in 16 20 29 32 40 48 50 55 57 58 60 64 66 72 76 80 87 88 92 100 102 114 120 128 144 152 167 172 180 196 216 256 512 1024; do
      check_ios_app_icon_bounds "$dir/${size}.png" "$size"
    done
  fi
done

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "=== Mobile image asset verification passed ==="
else
  echo "=== Mobile image asset verification FAILED ==="
fi

exit "$EXIT_CODE"
