import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';

class EntityService {
  final IAssetRepository _assetRepository;
  final IUserRepository _userRepository;
  EntityService(
    this._assetRepository,
    this._userRepository,
  );

  Future<Album> fillAlbumWithDatabaseEntities(Album album) async {
    final ownerId = album.ownerId;
    if (ownerId != null) {
      // replace owner with user from database
      album.owner.value = await _userRepository.get(ownerId);
    }
    final thumbnailAssetId =
        album.remoteThumbnailAssetId ?? album.thumbnail.value?.remoteId;
    if (thumbnailAssetId != null) {
      // set thumbnail with asset from database
      album.thumbnail.value =
          await _assetRepository.getByRemoteId(thumbnailAssetId);
    }
    if (album.remoteUsers.isNotEmpty) {
      // replace all users with users from database
      final users = await _userRepository
          .getByIds(album.remoteUsers.map((user) => user.id).toList());
      album.sharedUsers.clear();
      album.sharedUsers.addAll(users);
      album.shared = true;
    }
    if (album.remoteAssets.isNotEmpty) {
      // replace all assets with assets from database
      final assets = await _assetRepository
          .getAllByRemoteId(album.remoteAssets.map((asset) => asset.remoteId!));
      album.assets.clear();
      album.assets.addAll(assets);
    }
    return album;
  }
}

final entityServiceProvider = Provider(
  (ref) => EntityService(
    ref.watch(assetRepositoryProvider),
    ref.watch(userRepositoryProvider),
  ),
);
