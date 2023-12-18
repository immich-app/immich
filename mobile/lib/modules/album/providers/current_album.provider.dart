import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/album.dart';

final currentAlbumProvider = StateProvider<Album?>((ref) {
  return null;
});
