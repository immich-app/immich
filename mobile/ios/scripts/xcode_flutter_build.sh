#!/usr/bin/env bash
# Makes Flutter's builds through the Xcode GUI properly display errors and warnings
# in the Issue navigator
#
# Flutter's `xcode_backend.dart` runs `flutter assemble` with `allowFail: true`,
# which intentionally does not prefix output with `error:`. Unsure why they do this,
# but this script rebuilds the expected output so Xcode can parse and display the errors

set -o pipefail

# The Immich mobile root (containing the Dart `lib` directory). This is used to make
# absolute paths for Xcode linking
app_root="${FLUTTER_APPLICATION_PATH:-$SRCROOT/..}"

/bin/sh "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" build 2>&1 \
  | awk -v app_root="$app_root" '
    # Match Dart CFE diagnostics: <path>.dart:<line>:<col>: <Kind>: <message>
    # Written for macOS/POSIX/BSD awk
    {
      # Always pass the original line through to preserve the original build log
      print

      if ($0 ~ /^.*\.dart:[0-9]+:[0-9]+: (Error|Warning|Context|Info):/) {
        # Locate the ": Kind:" separator to split location from message.
        rest = $0
        if      (match(rest, /: Error:/))   { kind = "Error";   keyword = "error"   }
        else if (match(rest, /: Warning:/)) { kind = "Warning"; keyword = "warning" }
        else if (match(rest, /: Context:/)) { kind = "Context"; keyword = "note"    }
        else if (match(rest, /: Info:/))    { kind = "Info";    keyword = "note"    }

        # location = everything before ": Kind:" (e.g. "lib/foo.dart:12:5")
        location = substr(rest, 1, RSTART - 1)
        # message = everything after ": Kind:" (leading space preserved)
        message = substr(rest, RSTART + length(": " kind ":"))

        # Make the path absolute so Xcode links to it
        if (location !~ /^\//)
          location = app_root "/" location

        printf "%s: %s:%s\n", location, keyword, message
      }
    }
  '

exit "${PIPESTATUS[0]}"
