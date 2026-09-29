import 'dart:io';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_android.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_stub.dart';

abstract class ViewIntentHandler {
  void init();

  Future<void> onAppResumed();

  Future<void> flushDeferredViewIntent();

  Future<void> handle(ViewIntentPayload attachment);
}

final viewIntentHandlerProvider = Provider<ViewIntentHandler>((ref) {
  if (Platform.isAndroid) {
    return AndroidViewIntentHandler(ref);
  }

  return const StubViewIntentHandler();
});
