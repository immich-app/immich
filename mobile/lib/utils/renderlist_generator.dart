import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:isar/isar.dart';

Stream<RenderList> renderListGenerator(
  QueryBuilder<Asset, Asset, QAfterSortBy> query,
  StreamProviderRef<RenderList> ref,
) {
  final settings = ref.watch(appSettingsServiceProvider);
  final groupBy =
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)];
  return renderListGeneratorWithGroupBy(query, groupBy);
}

Stream<RenderList> renderListGeneratorWithGroupBy(
  QueryBuilder<Asset, Asset, QAfterSortBy> query,
  GroupAssetsBy groupBy,
) async* {
  yield await RenderList.fromQuery(query, groupBy);
  await for (final _ in query.watchLazy()) {
    yield await RenderList.fromQuery(query, groupBy);
  }
}
