import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:share_handler/share_handler.dart';

@RoutePage()
class ShareIntentPage extends ConsumerWidget {
  const ShareIntentPage({super.key, required this.attachments});

  final List<SharedAttachment?> attachments;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Upload to Immich (${attachments.length})'),
      ),
      body: ListView.builder(
        itemCount: attachments.length,
        itemBuilder: (context, index) {
          final attachment = attachments[index];
          if (attachment == null) {
            return const SizedBox.shrink();
          }

          final file = File(attachment.path);
          final fileName = file.uri.pathSegments.last;
          final fileSize = formatHumanReadableBytes(file.lengthSync(), 2);

          final isVideo = attachment.type == SharedAttachmentType.video;
          final isImage = attachment.type == SharedAttachmentType.image;

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 16),
            child: LargeLeadingTile(
              onTap: () {},
              selected: true,
              leading: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(
                      file,
                      width: 64,
                      height: 64,
                      fit: BoxFit.cover, // Make image fit inside the leading
                    ),
                  ),
                  if (isVideo)
                    const Positioned(
                      top: 8,
                      right: 8,
                      child: Icon(
                        Icons.videocam,
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
                'Size: $fileSize',
                style: context.textTheme.labelLarge,
              ),
              trailing: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Icon(
                  Icons.check_circle_rounded,
                  color: context.primaryColor,
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
            onPressed: () {
              // Handle upload action
            },
            child: const Text('Upload'),
          ),
        ),
      ),
    );
  }
}
