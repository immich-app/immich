import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:logging/logging.dart';

Future<void> syncLinkedAlbumsIsolated(ProviderContainer ref) async {
  final user = await ref.read(authUserRepositoryProvider).get();
  if (user == null) {
    Logger("SyncLinkedAlbum").warning("No user logged in, skipping linked album sync");
    return;
  }
  return ref.read(syncLinkedAlbumServiceProvider).syncLinkedAlbums(user.id);
}
