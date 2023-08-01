import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';

final albumDetailProvider =
    StreamProvider.family<Album, int>((ref, albumId) async* {
  final user = ref.watch(currentUserProvider);
  if (user == null) return;
  final AlbumService service = ref.watch(albumServiceProvider);

  await for (final a in service.watchAlbum(albumId)) {
    if (a == null) {
      throw Exception("Album with ID=$albumId does not exist anymore!");
    }
    await for (final _ in a.watchRenderList(GroupAssetsBy.none)) {
      yield a;
    }
  }
});
