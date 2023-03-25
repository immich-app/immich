import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';

final renderListProvider = FutureProvider.family<RenderList, List<Asset>>((ref, assets) {
  var settings = ref.watch(appSettingsServiceProvider);

  final layout = AssetGridLayoutParameters(
    settings.getSetting(AppSettingsEnum.tilesPerRow),
    settings.getSetting(AppSettingsEnum.dynamicLayout),
    GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)],
  );

  return RenderList.fromAssets(assets, layout);
});
