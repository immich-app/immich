import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';

class StubViewIntentHandler implements ViewIntentHandler {
  const StubViewIntentHandler();

  @override
  void init() {}

  @override
  Future<void> onAppResumed() async {}

  @override
  Future<void> flushDeferredViewIntent() async {}

  @override
  Future<void> handle(ViewIntentPayload attachment) async {}

  @override
  Future<void> refreshCurrentAfterUpload({
    required String remoteAssetId,
    required ViewIntentPayload attachment,
    Duration timeout = const Duration(seconds: 15),
  }) async {}
}
