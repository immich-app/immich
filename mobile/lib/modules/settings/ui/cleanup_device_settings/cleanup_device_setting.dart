import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/settings/ui/cleanup_device_settings/automatic_device_setting.dart';
import 'package:immich_mobile/modules/settings/ui/cleanup_device_settings/manual_device_cleanup.dart';

class CleanupDeviceSettings extends HookConsumerWidget {
  const CleanupDeviceSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);

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
        ManualDeviceCleanupWidget(
          backupState: backupState,
        ),
        //const AutomaticDeviceCleanupWidget(),
        //for now disabled until proper implementation
      ],
    );
  }
}
