import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class FailedBackupStatusPage extends HookConsumerWidget {
  const FailedBackupStatusPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Failed Backup Status'),
      ),
      body: const Center(
        child: Text('Failed Backup Status'),
      ),
    );
  }
}
