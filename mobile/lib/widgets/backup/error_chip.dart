import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/providers/backup/error_backup_list.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/backup/error_chip_text.dart';

class BackupErrorChip extends ConsumerWidget {
  const BackupErrorChip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasErrors =
        ref.watch(errorBackupListProvider.select((value) => value.isNotEmpty));
    if (!hasErrors) {
      return const SizedBox();
    }

    return ActionChip(
      avatar: const Icon(
        Icons.info,
        color: red400,
      ),
      elevation: 1,
      visualDensity: VisualDensity.compact,
      label: const BackupErrorChipText(),
      backgroundColor: Colors.white,
      onPressed: () => context.pushRoute(const FailedBackupStatusRoute()),
    );
  }
}
