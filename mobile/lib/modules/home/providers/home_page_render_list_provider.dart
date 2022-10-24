import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

final renderListProvider = StateProvider((ref) {
  var assetGroups = ref.watch(assetGroupByDateTimeProvider);

  var settings = ref.watch(appSettingsServiceProvider);
  final assetsPerRow = settings.getSetting(AppSettingsEnum.tilesPerRow);

  return assetGroupsToRenderList(assetGroups, assetsPerRow);
});
