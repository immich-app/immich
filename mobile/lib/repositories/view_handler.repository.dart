import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/view_intent/view_intent_attachment.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';

final viewHandlerRepositoryProvider = Provider((ref) => ViewHandlerRepository(ViewIntentHostApi()));

class ViewHandlerRepository {
  final ViewIntentHostApi _viewIntentHostApi;

  const ViewHandlerRepository(this._viewIntentHostApi);

  Future<ViewIntentAttachment?> checkViewIntent() async {
    try {
      final result = await _viewIntentHostApi.consumeViewIntent();
      if (result == null) {
        return null;
      }
      return ViewIntentAttachment(
        path: result.path,
        type: result.type == ViewIntentType.image ? ViewIntentAttachmentType.image : ViewIntentAttachmentType.video,
        localAssetId: result.localAssetId,
      );
    } catch (_) {
      // Ignore errors - view intent might not be present
      return null;
    }
  }
}
