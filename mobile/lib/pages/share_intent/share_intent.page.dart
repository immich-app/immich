import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:share_handler/share_handler.dart';

@RoutePage()
class ShareIntentPage extends ConsumerWidget {
  const ShareIntentPage({super.key, required this.attachments});

  final List<SharedAttachment?> attachments;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Share Intent'),
      ),
      body: ListView.builder(
        itemCount: attachments.length,
        itemBuilder: (context, index) {
          final attachment = attachments[index]!;
          return ListTile(
            title: Text(attachment.path),
            subtitle: Text(attachment.type.toString()),
          );
        },
      ),
    );
  }
}
