import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:share_handler/share_handler.dart';

final shareHandlerRepositoryProvider = Provider(
  (ref) => ShareHandlerRepository(),
);

class ShareHandlerRepository {
  ShareHandlerRepository();

  void Function(List<ShareIntentAttachment> attachments)? onSharedMedia;

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

      final fileLength = File(attachment.path).lengthSync();

      payload.add(
        ShareIntentAttachment(
          path: attachment.path,
          type: type,
          status: UploadStatus.enqueued,
          uploadProgress: 0.0,
          fileLength: fileLength,
        ),
      );
    }

    return payload;
  }
}
