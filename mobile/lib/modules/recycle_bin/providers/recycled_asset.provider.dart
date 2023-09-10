import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:isar/isar.dart';

final recycledAssetsProvider = StreamProvider<RenderList>((ref) async* {
  final user = ref.watch(currentUserProvider);
  if (user == null) return;
  final query = ref
      .watch(dbProvider)
      .assets
      .filter()
      .ownerIdEqualTo(user.isarId)
      .isTrashedEqualTo(true)
      .sortByFileCreatedAt();
  const groupBy = GroupAssetsBy.none;
  yield await RenderList.fromQuery(query, groupBy);
  await for (final _ in query.watchLazy()) {
    yield await RenderList.fromQuery(query, groupBy);
  }
});

final allRecycledAssetsProvider = Provider<List<Asset>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ref
      .read(dbProvider)
      .assets
      .filter()
      .ownerIdEqualTo(user.isarId)
      .isTrashedEqualTo(true)
      .findAllSync();
});
