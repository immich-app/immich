import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';

import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/asset_viewer/share_intent_upload.provider.dart';
import 'package:immich_mobile/entities/store.entity.dart' as db_store;

@RoutePage()
class ShareIntentPage extends HookConsumerWidget {
  const ShareIntentPage({super.key, required this.attachments});

  final List<ShareIntentAttachment> attachments;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint =
        db_store.Store.get(db_store.StoreKey.serverEndpoint);
    final candidates = ref.watch(shareIntentUploadProvider);
    final isUploaded = useState(false);

    useEffect(
      () {
        Future.microtask(() {
          ref
              .read(shareIntentUploadProvider.notifier)
              .addAttachments(attachments);
        });
        return () {};
      },
      const [],
    );

    void removeAttachment(ShareIntentAttachment attachment) {
      ref.read(shareIntentUploadProvider.notifier).removeAttachment(attachment);
    }

    void addAttachments(List<ShareIntentAttachment> attachments) {
      ref.read(shareIntentUploadProvider.notifier).addAttachments(attachments);
    }

    void upload() async {
      for (final attachment in candidates) {
        await ref
            .read(shareIntentUploadProvider.notifier)
            .upload(attachment.file);
      }

      isUploaded.value = true;
    }

    bool isSelected(ShareIntentAttachment attachment) {
      return candidates.contains(attachment);
    }

    void toggleSelection(ShareIntentAttachment attachment) {
      if (isSelected(attachment)) {
        removeAttachment(attachment);
      } else {
        addAttachments([attachment]);
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text('Upload to Immich (${candidates.length})'),
            Text(
              currentEndpoint,
              style: context.textTheme.labelMedium?.copyWith(
                color: context.colorScheme.onSurface.withAlpha(200),
              ),
            ),
          ],
        ),
      ),
      body: ListView.builder(
        itemCount: attachments.length,
        itemBuilder: (context, index) {
          final attachment = attachments[index];
          final target = candidates.firstWhere(
            (element) => element.id == attachment.id,
            orElse: () => attachment,
          );

          return Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 4.0,
              horizontal: 16,
            ),
            child: LargeLeadingTile(
              onTap: () => toggleSelection(attachment),
              disabled: isUploaded.value,
              selected: isSelected(attachment),
              leading: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: attachment.isImage
                        ? Image.file(
                            attachment.file,
                            width: 64,
                            height: 64,
                            fit: BoxFit.cover,
                          )
                        : const SizedBox(
                            width: 64,
                            height: 64,
                            child: Center(
                              child: Icon(
                                Icons.videocam,
                                color: Colors.white,
                              ),
                            ),
                          ),
                  ),
                  if (attachment.isImage)
                    const Positioned(
                      top: 8,
                      right: 8,
                      child: Icon(
                        Icons.image,
                        color: Colors.white,
                        size: 20,
                        shadows: [
                          Shadow(
                            offset: Offset(0, 0),
                            blurRadius: 8.0,
                            color: Colors.black45,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              title: Text(
                attachment.fileName,
                style: context.textTheme.titleSmall,
              ),
              subtitle: Text(
                attachment.fileSize,
                style: context.textTheme.labelLarge,
              ),
              trailing: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: UploadStatusIcon(
                  selected: isSelected(attachment),
                  status: target.status,
                  progress: target.uploadProgress,
                ),
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: isUploaded.value ? null : upload,
              child: const Text('UPLOAD'),
            ),
          ),
        ),
      ),
    );
  }
}

class UploadStatusIcon extends StatelessWidget {
  const UploadStatusIcon({
    super.key,
    required this.status,
    required this.selected,
    this.progress = 0,
  });

  final UploadStatus status;
  final double progress;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    if (!selected) {
      return Icon(
        Icons.check_circle_outline_rounded,
        color: context.colorScheme.onSurface.withAlpha(100),
        semanticLabel: 'Not selected',
      );
    }

    switch (status) {
      case UploadStatus.enqueued:
        return Icon(
          Icons.check_circle_rounded,
          color: context.primaryColor,
          semanticLabel: 'Enqueued',
        );
      case UploadStatus.running:
        return Stack(
          alignment: AlignmentDirectional.center,
          children: [
            const SizedBox(
              width: 40,
              height: 40,
              child: CircularProgressIndicator(
                backgroundColor: Colors.grey,
                strokeWidth: 3,
                value: 0.5,
                semanticsLabel: 'Uploading',
              ),
            ),
            Text(
              "${(progress * 100).toStringAsFixed(0)}%",
              style: context.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        );
      case UploadStatus.complete:
        return const Icon(
          Icons.check_circle_rounded,
          color: Colors.green,
          semanticLabel: 'Complete',
        );
      case UploadStatus.notFound:
      case UploadStatus.failed:
        return const Icon(
          Icons.error_rounded,
          color: Colors.red,
          semanticLabel: 'Failed',
        );
      case UploadStatus.canceled:
        return const Icon(
          Icons.cancel_rounded,
          color: Colors.red,
        );
      case UploadStatus.waitingtoRetry:
      case UploadStatus.paused:
        return Icon(
          Icons.pause_circle_rounded,
          color: context.primaryColor,
          semanticLabel: 'Paused',
        );
    }
  }
}
