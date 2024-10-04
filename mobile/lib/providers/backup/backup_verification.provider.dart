import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/services/backup_verification.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

part 'backup_verification.provider.g.dart';

@riverpod
class BackupVerification extends _$BackupVerification {
  @override
  bool build() => false;

  void performBackupCheck(BuildContext context) async {
    try {
      state = true;
      final backupState = ref.read(backupProvider);

      if (backupState.allUniqueAssets.length >
          backupState.selectedAlbumsBackupAssetsIds.length) {
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: "Backup all assets before starting this check!",
            toastType: ToastType.error,
          );
        }
        return;
      }
      final connection = await Connectivity().checkConnectivity();
      if (connection.contains(ConnectivityResult.wifi)) {
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: "Make sure to be connected to unmetered Wi-Fi",
            toastType: ToastType.error,
          );
        }
        return;
      }
      WakelockPlus.enable();

      const limit = 100;
      final toDelete = await ref
          .read(backupVerificationServiceProvider)
          .findWronglyBackedUpAssets(limit: limit);
      if (toDelete.isEmpty) {
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: "Did not find any corrupt asset backups!",
            toastType: ToastType.success,
          );
        }
      } else {
        if (context.mounted) {
          await showDialog(
            context: context,
            builder: (ctx) => ConfirmDialog(
              onOk: () => _performDeletion(context, toDelete),
              title: "Corrupt backups!",
              ok: "Delete",
              content:
                  "Found ${toDelete.length} (max $limit at once) corrupt asset backups. "
                  "Run the check again to find more.\n"
                  "Do you want to delete the corrupt asset backups now?",
            ),
          );
        }
      }
    } finally {
      WakelockPlus.disable();
      state = false;
    }
  }

  Future<void> _performDeletion(
    BuildContext context,
    List<Asset> assets,
  ) async {
    try {
      state = true;
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: "Deleting ${assets.length} assets on the server...",
        );
      }
      await ref.read(assetProvider.notifier).deleteAssets(assets, force: true);
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: "Deleted ${assets.length} assets on the server. "
              "You can now start a manual backup",
          toastType: ToastType.success,
        );
      }
    } finally {
      state = false;
    }
  }
}
