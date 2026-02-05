import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/models/view_intent/view_intent_attachment.model.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

@RoutePage()
class ExternalMediaViewerPage extends StatelessWidget {
  const ExternalMediaViewerPage({super.key, required this.attachment});

  final ViewIntentAttachment attachment;

  @override
  Widget build(BuildContext context) {
    final file = File(attachment.path);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(attachment.fileName, overflow: TextOverflow.ellipsis),
      ),
      body: Center(
        child: attachment.isImage
            ? PhotoView(
                index: 0,
                imageProvider: FileImage(file),
                backgroundDecoration: const BoxDecoration(color: Colors.black),
              )
            : AspectRatio(
                aspectRatio: 16 / 9,
                child: Center(child: Icon(Icons.videocam, size: 64, color: Colors.white.withValues(alpha: 0.8))),
              ),
      ),
    );
  }
}
