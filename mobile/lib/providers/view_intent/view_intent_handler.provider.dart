import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_factory.dart';

abstract class ViewIntentHandler {
  void init();

  Future<void> onAppResumed();

  Future<void> onUserAuthenticated();

  Future<void> handle(ViewIntentPayload attachment);
}

final viewIntentHandlerProvider = Provider<ViewIntentHandler>((ref) {
  return createViewIntentHandler(ref);
});
