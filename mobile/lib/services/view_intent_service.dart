import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/view_intent/view_intent_attachment.model.dart';
import 'package:immich_mobile/repositories/view_handler.repository.dart';

final viewIntentServiceProvider = Provider((ref) => ViewIntentService(ref.watch(viewHandlerRepositoryProvider)));

class ViewIntentService {
  final ViewHandlerRepository _viewHandlerRepository;
  Future<void> Function(List<ViewIntentAttachment> attachments)? onViewMedia;
  ViewIntentAttachment? _pendingAttachment;

  ViewIntentService(this._viewHandlerRepository);

  Future<void> checkViewIntent() async {
    final attachment = await _viewHandlerRepository.checkViewIntent();
    if (attachment != null) {
      final handler = onViewMedia;
      if (handler == null) {
        _pendingAttachment = attachment;
        return;
      }
      await handler([attachment]);
    }
  }

  void defer(ViewIntentAttachment attachment) {
    _pendingAttachment = attachment;
  }

  Future<void> flushPending() async {
    final pendingAttachment = _pendingAttachment;
    final handler = onViewMedia;
    if (pendingAttachment == null || handler == null) {
      return;
    }
    _pendingAttachment = null;
    await handler([pendingAttachment]);
  }
}
