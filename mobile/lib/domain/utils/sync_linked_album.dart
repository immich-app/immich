import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/providers/user.provider.dart';

Future<void> syncLinkedAlbumsIsolated(ProviderContainer ref) {
  final user = ref.read(currentUserProvider);
  if (user == null) {
    return Future.value();
  }
  return ref.read(syncLinkedAlbumServiceProvider).syncLinkedAlbums(user.id);
}
