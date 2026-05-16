import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class ImageViewerTapToNavigateSetting extends HookConsumerWidget {
  const ImageViewerTapToNavigateSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tapToNavigate = useState(ref.read(appConfigProvider).viewer.tapToNavigate);
    useValueChanged<bool, void>(tapToNavigate.value, (_, __) {
      ref.read(metadataProvider).write(.viewerTapToNavigate, tapToNavigate.value);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "setting_image_navigation_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: tapToNavigate,
          title: "setting_image_navigation_enable_title".tr(),
          subtitle: "setting_image_navigation_enable_subtitle".tr(),
        ),
      ],
    );
  }
}
