import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';
import 'package:isar/isar.dart';

final archiveProvider = StreamProvider<RenderList>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return const Stream.empty();
  final query = ref
      .watch(dbProvider)
      .assets
      .where()
      .ownerIdEqualToAnyChecksum(user.isarId)
      .filter()
      .isArchivedEqualTo(true)
      .isTrashedEqualTo(false)
      .sortByFileCreatedAtDesc();
  return renderListGenerator(query, ref);
});
