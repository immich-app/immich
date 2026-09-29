import 'dart:async';

import 'package:flutter/services.dart';

/// Restore the system bars and return to edge-to-edge layout.
///
/// On Android 15+/API 36 edge-to-edge is enforced, so calling
/// setEnabledSystemUIMode(edgeToEdge) does NOT re-show bars that an immersive
/// mode (immersive / immersiveSticky) previously hid. Explicitly request all
/// overlays first, then return to edge-to-edge layout.
Future<void> restoreEdgeToEdge() async {
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: SystemUiOverlay.values);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
}
