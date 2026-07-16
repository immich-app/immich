import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';

class StubViewIntentHandler implements ViewIntentHandler {
  const StubViewIntentHandler();

  @override
  Future<bool> init() async => false;

  @override
  Future<void> onAppResumed() async {}

  @override
  Future<bool> flushDeferredViewIntent() async => false;

  @override
  Future<void> handle(ViewIntentPayload attachment) async {}
}
