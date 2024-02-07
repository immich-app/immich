import 'package:immich_mobile/modules/album/services/local_album.service.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/hash.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'local_album_service.provider.g.dart';

@Riverpod(keepAlive: true)
LocalAlbumService localAlbumService(LocalAlbumServiceRef ref) =>
    LocalAlbumService(
      ref.watch(dbProvider),
      ref.read(hashServiceProvider),
      ref.read(syncServiceProvider),
      ref,
    );
