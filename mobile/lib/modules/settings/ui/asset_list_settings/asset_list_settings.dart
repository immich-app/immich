import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/ui/asset_list_settings/asset_list_layout_settings.dart';
import 'package:immich_mobile/modules/settings/ui/asset_list_settings/asset_list_storage_indicator.dart';
import 'asset_list_tiles_per_row.dart';

class AssetListSettings extends StatelessWidget {
  const AssetListSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      textColor: context.primaryColor,
      title: Text(
        'asset_list_settings_title',
        style: context.textTheme.titleMedium,
      ).tr(),
      subtitle: const Text(
        'asset_list_settings_subtitle',
      ).tr(),
      children: const [
        TilesPerRow(),
        StorageIndicator(),
        LayoutSettings(),
      ],
    );
  }
}
