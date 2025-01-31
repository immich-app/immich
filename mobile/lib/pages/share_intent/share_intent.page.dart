import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
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
            const Text('upload_to_immich').tr(
              args: [
                candidates.length.toString(),
              ],
            ),
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
                    borderRadius: const BorderRadius.all(Radius.circular(16)),
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
              child: isUploaded.value
                  ? UploadingText(candidates: candidates)
                  : const Text('upload').tr(),
            ),
          ),
        ),
      ),
    );
  }
}

class UploadingText extends StatelessWidget {
  const UploadingText({super.key, required this.candidates});
  final List<ShareIntentAttachment> candidates;

  @override
  Widget build(BuildContext context) {
    final uploadedCount = candidates.where((element) {
      return element.status == UploadStatus.complete;
    }).length;

    return const Text("shared_intent_upload_button_progress_text")
        .tr(args: [uploadedCount.toString(), candidates.length.toString()]);
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
        semanticLabel: 'not_selected'.tr(),
      );
    }

    final statusIcon = switch (status) {
      UploadStatus.enqueued => Icon(
          Icons.check_circle_rounded,
          color: context.primaryColor,
          semanticLabel: 'enqueued'.tr(),
        ),
      UploadStatus.running => Stack(
          alignment: AlignmentDirectional.center,
          children: [
            SizedBox(
              width: 40,
              height: 40,
              child: TweenAnimationBuilder(
                tween: Tween<double>(begin: 0.0, end: progress),
                duration: const Duration(milliseconds: 500),
                builder: (context, value, _) => CircularProgressIndicator(
                  backgroundColor: context.colorScheme.surfaceContainerLow,
                  strokeWidth: 3,
                  value: value,
                  semanticsLabel: 'uploading'.tr(),
                ),
              ),
            ),
            Text(
              (progress * 100).toStringAsFixed(0),
              style: context.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      UploadStatus.complete => Icon(
          Icons.check_circle_rounded,
          color: Colors.green,
          semanticLabel: 'completed'.tr(),
        ),
      UploadStatus.notFound || UploadStatus.failed => Icon(
          Icons.error_rounded,
          color: Colors.red,
          semanticLabel: 'failed'.tr(),
        ),
      UploadStatus.canceled => Icon(
          Icons.cancel_rounded,
          color: Colors.red,
          semanticLabel: 'canceled'.tr(),
        ),
      UploadStatus.waitingtoRetry || UploadStatus.paused => Icon(
          Icons.pause_circle_rounded,
          color: context.primaryColor,
          semanticLabel: 'paused'.tr(),
        ),
    };

    return statusIcon;
  }
}
