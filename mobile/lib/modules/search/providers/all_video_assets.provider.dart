import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';

final allVideoAssetsProvider = StreamProvider<RenderList>((ref) {
  final query = ref
      .watch(dbProvider)
      .assets
      .filter()
      .isArchivedEqualTo(false)
      .isTrashedEqualTo(false)
      .typeEqualTo(AssetType.video)
      .sortByFileCreatedAtDesc();
  return renderListGenerator(query, ref);
});
