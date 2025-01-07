import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';

import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/asset_viewer/share_intent_upload.provider.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
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

    void upload() {
      showDialog(
        useSafeArea: true,
        barrierDismissible: false,
        context: context,
        builder: (context) {
          return AlertDialog(
            icon: const Icon(Icons.upload_rounded),
            actions: [
              TextButton(
                onPressed: () => context.pop(),
                child: const Text('Cancel'),
              ),
            ],
            content: const LinearProgressIndicator(),
          );
        },
      );
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
              style: context.textTheme.labelSmall?.copyWith(
                color: context.colorScheme.onSurface.withAlpha(150),
              ),
            ),
          ],
        ),
      ),
      body: ListView.builder(
        itemCount: attachments.length,
        itemBuilder: (context, index) {
          final attachment = attachments[index];
          final file = File(attachment.path);
          final fileName = file.uri.pathSegments.last;
          final fileSize = formatHumanReadableBytes(file.lengthSync(), 2);
          final isImage = attachment.type == ShareIntentAttachmentType.image;

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 16),
            child: LargeLeadingTile(
              onTap: () {
                // ref.read(shareIntentUploadProvider.notifier).upload(file);
                toggleSelection(attachment);
              },
              selected: isSelected(attachment),
              leading: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: isImage
                        ? Image.file(
                            file,
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
                  if (isImage)
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
                fileName,
                style: context.textTheme.titleSmall,
              ),
              subtitle: Text(
                fileSize,
                style: context.textTheme.labelLarge,
              ),
              trailing: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: isSelected(attachment)
                    ? Icon(
                        Icons.check_circle_rounded,
                        color: context.primaryColor,
                      )
                    : Icon(
                        Icons.check_circle_outline_rounded,
                        color: context.colorScheme.onSurface.withAlpha(150),
                      ),
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: upload,
            child: const Text('Upload'),
          ),
        ),
      ),
    );
  }
}
