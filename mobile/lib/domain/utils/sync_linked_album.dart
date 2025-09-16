import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';

Future<void> syncLinkedAlbumsIsolated(ProviderContainer ref) {
  final user = Store.tryGet(StoreKey.currentUser);
  if (user == null) {
    return Future.value();
  }
  return ref.read(syncLinkedAlbumServiceProvider).syncLinkedAlbums(user.id);
}
