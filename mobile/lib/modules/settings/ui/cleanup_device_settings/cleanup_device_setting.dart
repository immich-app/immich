import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/home/ui/delete_diaglog.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:openapi/api.dart';

class CleanupDeviceSettings extends HookConsumerWidget {
  const CleanupDeviceSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    var isUploaded = backupState.allUniqueAssets.length ==
        backupState.selectedAlbumsBackupAssetsIds.length;

    useEffect(
      () {
        return null;
      },
      [],
    );

    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'cleanup_device_settings_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'cleanup_device_settings_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(0, 5, 20, 0),
          child: Row(
            children: [
              SizedBox(
                width: 250,
                child: ListTile(
                  title: Text(
                    isUploaded
                        ? "delete_backed_up_assets_enabled"
                        : "delete_backed_up_assets_disabled",
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ).tr(),
                  subtitle: const Text(
                    "delete_backed_up_assets_description",
                    style: TextStyle(
                      fontSize: 12,
                    ),
                  ).tr(),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: isUploaded
                    ? () {
                        showDialog(
                          context: context,
                          builder: (BuildContext context) {
                            return DeleteDialog(
                              title: "delete_backed_up_assets_enabled",
                              subtitle: "delete_backed_up_assets_description",
                              deleteFunction: () {
                                debugPrint("Deleting Local Assets");
                                ref
                                    .watch(assetProvider.notifier)
                                    .deleteLocalAssets(
                                      backupState.allUniqueAssets,
                                    );
                                Navigator.of(context).pop();
                              },
                            );
                          },
                        );
                      }
                    : null,
                child: Text("delete_dialog_ok".tr()),
              ),
            ],
          ),
        )
      ],
    );
  }
}
