import 'package:flutter/services.dart';

// True when a gallery save failed because MediaStore rejected the file's MIME.
// Android raises `Unsupported MIME type` for formats it can't type (e.g. raw
// like CR3), where photo_manager falls back to `image/*`. Matched on the detail
// string (case-insensitive) because photo_manager surfaces no distinct error
// code for it. Keeps `mime type` in the match so it doesn't catch unrelated
// `Unsupported*` errors (e.g. UnsupportedOperationException).
bool isUnsupportedMimeError(PlatformException e) {
  final details = e.details;
  return details is String && details.toLowerCase().contains('unsupported mime type');
}
