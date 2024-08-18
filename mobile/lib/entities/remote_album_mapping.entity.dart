import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'remote_album_mapping.entity.g.dart';

@Collection()
class RemoteAlbumMapping {
  RemoteAlbumMapping(
      {required this.localAlbumMappingId, required this.remoteAlbumMappingId});

  Id get id => fastHash(localAlbumMappingId);
  @Index(unique: true)
  String localAlbumMappingId;
  String? remoteAlbumMappingId;
}
