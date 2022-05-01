import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Select Albums"),
      ),
      body: Column(
        children: const [
          Text("Album List"),
        ],
      ),
    );
  }
}
