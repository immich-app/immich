import 'dart:io';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_android.dart';

final viewIntentHandlerProvider = Provider<AndroidViewIntentHandler?>((ref) {
  if (Platform.isAndroid) {
    return AndroidViewIntentHandler(ref);
  }

  return null;
});
