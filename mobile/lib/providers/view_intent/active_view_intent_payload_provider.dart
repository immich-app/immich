import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';

class ActiveViewIntentNotifier extends Notifier<ViewIntentPayload?> {
  @override
  ViewIntentPayload? build() => null;

  void setPayload(ViewIntentPayload payload) {
    state = payload;
  }

  void clear() {
    state = null;
  }

  void clearIfMatch(ViewIntentPayload payload) {
    if (!identical(state, payload)) {
      return;
    }
    state = null;
  }
}

final activeViewIntentPayloadProvider = NotifierProvider<ActiveViewIntentNotifier, ViewIntentPayload?>(
  ActiveViewIntentNotifier.new,
);
