import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';

class ShareSetting extends HookConsumerWidget {
  const ShareSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fileType = useValueNotifier(ref.watch(appConfigProvider.select((s) => s.share.fileType)));

    void onChanged(ShareAssetFileType? value) {
      if (value != null) {
        fileType.value = value;
        ref.read(settingsProvider).write(SettingsKey.shareFileType, value);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "default_quality_title".t(context: context),
          icon: Icons.ios_share_outlined,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            "default_quality_subtitle".t(context: context),
            style: context.textTheme.bodyMedium!.copyWith(color: context.textTheme.bodyMedium!.color!.withAlpha(215)),
          ),
        ),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(
              title: 'share_original'.t(context: context),
              value: ShareAssetFileType.original,
            ),
            SettingsRadioGroup(
              title: 'share_preview'.t(context: context),
              value: ShareAssetFileType.preview,
            ),
          ],
          groupBy: fileType.value,
          onRadioChanged: onChanged,
        ),
      ],
    );
  }
}
