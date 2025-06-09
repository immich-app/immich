import 'dart:math';

import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

class MediumFactory {
  final Drift _db;

  const MediumFactory(Drift db) : _db = db;

  LocalAsset localAsset({
    String? id,
    String? name,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? checksum,
  }) {
    final random = Random();

    return LocalAsset(
      id: id ?? '${random.nextInt(1000000)}',
      name: name ?? 'Asset ${random.nextInt(1000000)}',
      checksum: checksum ?? '${random.nextInt(1000000)}',
      type: type ?? AssetType.image,
      createdAt: createdAt ??
          DateTime.fromMillisecondsSinceEpoch(random.nextInt(1000000000)),
      updatedAt: updatedAt ??
          DateTime.fromMillisecondsSinceEpoch(random.nextInt(1000000000)),
    );
  }

  LocalAlbum localAlbum({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? assetCount,
    BackupSelection? backupSelection,
    bool? isIosSharedAlbum,
  }) {
    final random = Random();

    return LocalAlbum(
      id: id ?? '${random.nextInt(1000000)}',
      name: name ?? 'Album ${random.nextInt(1000000)}',
      updatedAt: updatedAt ??
          DateTime.fromMillisecondsSinceEpoch(random.nextInt(1000000000)),
      assetCount: assetCount ?? random.nextInt(100),
      backupSelection: backupSelection ?? BackupSelection.none,
      isIosSharedAlbum: isIosSharedAlbum ?? false,
    );
  }

  T getRepository<T>() {
    switch (T) {
      case const (ILocalAlbumRepository):
        return DriftLocalAlbumRepository(_db) as T;
      default:
        throw Exception('Unknown repository: $T');
    }
  }
}
