import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/providers/backup/error_backup_list.provider.dart';

class BackupErrorChipText extends ConsumerWidget {
  const BackupErrorChipText({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(errorBackupListProvider).length;
    if (count == 0) {
      return const SizedBox();
    }

    return const Text(
      "backup_controller_page_failed",
      style: TextStyle(
        color: red400,
        fontWeight: FontWeight.bold,
        fontSize: 11,
      ),
    ).tr(namedArgs: {'count': count.toString()});
  }
}
