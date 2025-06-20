import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/backup/backup_verification.provider.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class CheckCorruptAssetSetting extends ConsumerWidget {
  const CheckCorruptAssetSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCorruptCheckInProgress = ref.watch(backupVerificationProvider);

    void handleCheckCorruptAsset() {
      ref.read(backupVerificationProvider.notifier).performBackupCheck(context);
    }

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingButtonListTile(
          title: 'check_corrupt_asset_backup'.t(context: context),
          subtileText:
              'check_corrupt_asset_backup_description'.t(context: context),
          buttonText: 'check_corrupt_asset_backup_button'.t(context: context),
          child: ResponsiveButton(
            onPressed:
                !isCorruptCheckInProgress ? handleCheckCorruptAsset : null,
            child: isCorruptCheckInProgress
                ? const SizedBox.square(
                    dimension: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    'check_corrupt_asset_backup_button'.t(context: context),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
