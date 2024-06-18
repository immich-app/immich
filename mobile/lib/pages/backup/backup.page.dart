import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';

@RoutePage()
class BackupPage extends StatefulHookConsumerWidget {
  const BackupPage({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _BackupPageState();
}

class _BackupPageState extends ConsumerState<BackupPage> {
  @override
  void initState() {
    ref.read(backupNotifierProvider.notifier).getBackupCandidates();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(backupNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Backup"),
        actions: [
          IconButton(
            icon: const Icon(Icons.play_circle_outline_rounded),
            onPressed: () {
              ref.read(backupNotifierProvider.notifier).startBackup();
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Test ${provider.uploadTasks.length}"),
          ],
        ),
      ),
    );
  }
}
