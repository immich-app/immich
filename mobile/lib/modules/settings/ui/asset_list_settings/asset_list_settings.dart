import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/ui/asset_list_settings/asset_list_storage_indicator.dart';
import 'asset_list_tiles_per_row.dart';

class AssetListSettings extends StatelessWidget {
  const AssetListSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'asset_list_settings_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'asset_list_settings_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: const [
        TilesPerRow(),
        StorageIndicator(),
      ],
    );
  }
}
