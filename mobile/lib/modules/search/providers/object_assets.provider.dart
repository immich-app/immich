import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';

final objectAssetsProvider = FutureProvider.family<List<Asset>, String>( (ref, objects) async {
  final search = await ref.watch(apiServiceProvider).searchApi.search(
    smartInfoPeriodObjects: [objects],
  );

  if (search == null) {
    return [];
  }

  return ref.watch(dbProvider)
      .assets
      .getAllByRemoteId(
        search.assets.items.map((e) => e.id),
      );

  /// This works offline, but we use the above
  /*
     return ref.watch(dbProvider).assets
      .filter()
      .livePhotoVideoIdIsNotNull()
      .findAll();
  */
});
