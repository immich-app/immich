import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';

class ViewIntentCurrentNotifier extends Notifier<ViewIntentPayload?> {
  @override
  ViewIntentPayload? build() => null;

  void setPayload(ViewIntentPayload payload) {
    state = payload;
  }

  void clear() {
    state = null;
  }
}

final viewIntentCurrentProvider = NotifierProvider<ViewIntentCurrentNotifier, ViewIntentPayload?>(
  ViewIntentCurrentNotifier.new,
);
