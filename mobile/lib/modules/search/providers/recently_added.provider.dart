import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';

final recentlyAddedProvider = FutureProvider<List<Asset>>( (ref) async {
  final search = await ref.watch(apiServiceProvider).searchApi.search(
    recent: true,
  );

  if (search == null) {
    return [];
  }

  return ref.watch(dbProvider)
      .assets
      .getAllByRemoteId(
        search.assets.items.map((e) => e.id),
      );
});
