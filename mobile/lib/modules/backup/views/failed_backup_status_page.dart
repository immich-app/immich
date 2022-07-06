import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';

class FailedBackupStatusPage extends HookConsumerWidget {
  const FailedBackupStatusPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final errorBackupList = ref.watch(errorBackupListProvider);

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          "Failed Backup",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
            onPressed: () {
              AutoRouter.of(context).pop(true);
            },
            splashRadius: 24,
            icon: const Icon(
              Icons.arrow_back_ios_rounded,
            )),
      ),
      body: Center(
        child: Text('Failed Backup Status ${errorBackupList.length}'),
      ),
    );
  }
}
