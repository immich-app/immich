import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';

final viewIntentNowProvider = Provider<DateTime Function()>((ref) => DateTime.now);

final viewIntentPendingProvider = NotifierProvider<ViewIntentPendingNotifier, ViewIntentPayload?>(
  ViewIntentPendingNotifier.new,
);

class ViewIntentPendingNotifier extends Notifier<ViewIntentPayload?> {
  static const _ttl = Duration(minutes: 10);

  DateTime? _deferredAt;

  @override
  ViewIntentPayload? build() => null;

  void defer(ViewIntentPayload attachment) {
    _deferredAt = ref.read(viewIntentNowProvider)();
    state = attachment;
  }

  ViewIntentPayload? takeIfFresh() {
    final attachment = state;
    final deferredAt = _deferredAt;
    state = null;
    _deferredAt = null;

    if (attachment == null) {
      return null;
    }

    if (deferredAt != null && ref.read(viewIntentNowProvider)().difference(deferredAt) > _ttl) {
      return null;
    }

    return attachment;
  }
}
