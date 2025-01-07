import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/share_handler.interface.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:share_handler/share_handler.dart';

final shareHandlerRepositoryProvider = Provider(
  (ref) => ShareHandlerRepository(),
);

class ShareHandlerRepository implements IShareHandlerRepository {
  ShareHandlerRepository();

  @override
  void Function(List<ShareIntentAttachment> attachments)? onSharedMedia;

  @override
  Future<void> init() async {
    final handler = ShareHandlerPlatform.instance;
    final media = await handler.getInitialSharedMedia();

    if (media != null && media.attachments != null) {
      onSharedMedia?.call(_buildPayload(media.attachments!));
    }

    handler.sharedMediaStream.listen((SharedMedia media) {
      if (media.attachments != null) {
        onSharedMedia?.call(_buildPayload(media.attachments!));
      }
    });
  }

  List<ShareIntentAttachment> _buildPayload(
    List<SharedAttachment?> attachments,
  ) {
    final payload = <ShareIntentAttachment>[];

    for (final attachment in attachments) {
      if (attachment == null) {
        continue;
      }

      final type = attachment.type == SharedAttachmentType.image
          ? ShareIntentAttachmentType.image
          : ShareIntentAttachmentType.video;

      payload.add(
        ShareIntentAttachment(
          path: attachment.path,
          type: type,
          status: UploadStatus.enqueued,
          uploadProgress: 0.0,
        ),
      );
    }

    return payload;
  }
}
