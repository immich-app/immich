import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/locked_album.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final lockedAlbumRepositoryProvider = Provider<LockedAlbumRepository>(
  (ref) => LockedAlbumApiRepository(ref.watch(apiServiceProvider).authenticationApi.apiClient),
);

abstract interface class LockedAlbumRepository {
  Future<LockedAlbumAccess> getAccess();
  Future<List<LockedAlbum>> getAll();
  Future<LockedAlbum> get(String id);
  Future<LockedAlbum> create(String name);
  Future<LockedAlbum> rename(String id, String name);
  Future<void> delete(String id);
  Future<LockedAlbumAssetPage> getAssets(String id, {int skip = 0, int take = 50});
  Future<void> addAssets(String id, List<String> ids);
  Future<void> removeAssets(String id, List<String> ids);
}

/// Uses generated album contracts with the existing authenticated client.
/// Private metadata is never routed through ordinary album sync.
class LockedAlbumApiRepository implements LockedAlbumRepository {
  const LockedAlbumApiRepository(this._client);

  final ApiClient _client;

  AlbumsApi get _albums => AlbumsApi(_client);

  Future<T> _safe<T>(Future<T> Function() operation) async {
    try {
      return await operation();
    } on ApiException catch (error) {
      // Generated errors include response bodies: do not expose or log them.
      throw ApiException(error.code, 'Locked group request failed');
    }
  }

  LockedAlbum _album(LockedAlbumResponseDto? value) {
    if (value == null) {
      throw ApiException(500, 'Locked group request failed');
    }
    return LockedAlbum(
      id: value.id,
      albumName: value.albumName,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      assetCount: value.assetCount,
    );
  }

  @override
  Future<LockedAlbumAccess> getAccess() async =>
      LockedAlbumAccess.fromJson(await _request('/auth/status', 'GET') as Map<String, dynamic>);

  Future<dynamic> _request(String path, String method) async {
    final response = await _client.invokeAPI(
      path,
      method,
      const <QueryParam>[],
      null,
      <String, String>{'Cache-Control': 'no-store'},
      <String, String>{},
      'application/json',
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      // Do not put private names, IDs, or the response body into errors/logs.
      throw ApiException(response.statusCode, 'Locked group request failed');
    }
    return response.statusCode == 204 ? null : jsonDecode(utf8.decode(response.bodyBytes));
  }

  static String _name(String value) {
    final name = value.trim();
    if (name.isEmpty || name.runes.length > 255) {
      throw ArgumentError('Group names must contain 1–255 characters');
    }
    return name;
  }

  static List<String> _ids(List<String> ids) {
    if (ids.isEmpty || ids.length > 100) {
      throw ArgumentError('Choose 1–100 asset IDs');
    }
    final uuid = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
    if (ids.any((id) => !uuid.hasMatch(id))) {
      throw ArgumentError('Enter valid asset UUIDs');
    }
    return List<String>.of(ids);
  }

  @override
  Future<List<LockedAlbum>> getAll() => _safe(() async {
    final values = await _albums.getAllLockedAlbums();
    if (values == null) {
      throw ApiException(500, 'Locked group request failed');
    }
    return values.map(_album).toList(growable: false);
  });

  @override
  Future<LockedAlbum> get(String id) => _safe(() async => _album(await _albums.getLockedAlbum(id)));

  @override
  Future<LockedAlbum> create(String name) =>
      _safe(() async => _album(await _albums.createLockedAlbum(CreateLockedAlbumDto(albumName: _name(name)))));

  @override
  Future<LockedAlbum> rename(String id, String name) =>
      _safe(() async => _album(await _albums.updateLockedAlbum(id, CreateLockedAlbumDto(albumName: _name(name)))));

  @override
  Future<void> delete(String id) => _safe(() => _albums.deleteLockedAlbum(id));

  @override
  Future<LockedAlbumAssetPage> getAssets(String id, {int skip = 0, int take = 50}) async {
    if (skip < 0 || take < 1 || take > 100) {
      throw ArgumentError('Invalid membership page');
    }
    return _safe(() async {
      final page = await _albums.getLockedAlbumAssets(id, skip: skip, take: take);
      if (page == null) {
        throw ApiException(500, 'Locked group request failed');
      }
      return LockedAlbumAssetPage(assetIds: page.assetIds, hasNextPage: page.hasNextPage);
    });
  }

  @override
  Future<void> addAssets(String id, List<String> ids) =>
      _safe(() => _albums.addLockedAlbumAssets(id, LockedAlbumAssetsDto(ids: _ids(ids))));

  @override
  Future<void> removeAssets(String id, List<String> ids) =>
      _safe(() => _albums.removeLockedAlbumAssets(id, LockedAlbumAssetsDto(ids: _ids(ids))));
}
