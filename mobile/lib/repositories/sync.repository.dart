import 'dart:convert';

import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/sync.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:immich_mobile/repositories/sync_api.repository.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final syncRepositoryProvider = Provider(
  (ref) => SyncRepository(
    ref.watch(dbProvider),
    ref.watch(syncApiRepositoryProvider),
  ),
);

class SyncRepository extends DatabaseRepository implements ISyncRepository {
  @override
  void Function(Album)? onAlbumAdded;

  @override
  void Function(Album)? onAlbumDeleted;

  @override
  void Function(Album)? onAlbumUpdated;

  @override
  void Function(Asset)? onAssetAdded;

  @override
  void Function(Asset)? onAssetDeleted;

  @override
  void Function(Asset)? onAssetUpdated;

  final SyncApiRepository _apiRepository;

  SyncRepository(super.db, this._apiRepository);

  @override
  Future<void> fullSync() {
    // TODO: implement fullSync
    throw UnimplementedError();
  }

  @override
  Future<void> incrementalSync() async {
    _apiRepository.getChanges().listen((event) async {
      print("event: $event");
      final type = jsonDecode(event)['type'];
      final data = jsonDecode(event)['data'];
      print("type: $type");
      print("data: $data");

      if (type == 'album_added') {
        final dto = AlbumResponseDto.fromJson(data);
        final album = await Album.remote(dto!);
        onAlbumAdded?.call(album);
      } else if (type == 'album_deleted') {
        final dto = AlbumResponseDto.fromJson(data);
        final album = await Album.remote(dto!);
        onAlbumDeleted?.call(album);
      } else if (type == 'album_updated') {
        final dto = AlbumResponseDto.fromJson(data);
        final album = await Album.remote(dto!);
        onAlbumUpdated?.call(album);
      } else if (type == 'asset_added') {
        final dto = AssetResponseDto.fromJson(data);
        final asset = Asset.remote(dto!);
        onAssetAdded?.call(asset);
      } else if (type == 'asset_deleted') {
        final dto = AssetResponseDto.fromJson(data);
        final asset = Asset.remote(dto!);
        onAssetDeleted?.call(asset);
      } else if (type == 'asset_updated') {
        final dto = AssetResponseDto.fromJson(data);
        final asset = Asset.remote(dto!);
        onAssetUpdated?.call(asset);
      }
    });
  }
}
