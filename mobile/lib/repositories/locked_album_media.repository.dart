import 'dart:typed_data';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:openapi/api.dart';

final lockedAlbumMediaProvider = Provider((ref) {
  final db = ref.watch(driftProvider);
  return LockedAlbumMediaRepository(
    ref.watch(apiServiceProvider).authenticationApi.apiClient,
    list: (owner, offset) async =>
        (await db.timelineRepository.locked(owner, GroupAssetsBy.day).assetSource(offset, 50))
            .whereType<RemoteAsset>()
            .toList(),
    get: db.remoteAssetRepository.get,
  );
});

/// Reads existing synced assets; never persists private membership or previews.
class LockedAlbumMediaRepository {
  const LockedAlbumMediaRepository(this._client, {required this.list, required this.get});
  final ApiClient _client;
  final Future<List<RemoteAsset>> Function(String owner, int offset) list;
  final Future<RemoteAsset?> Function(String id) get;

  Future<Uint8List> thumbnail(String id) async {
    final response = await _client
        .invokeAPI(
          '/assets/${Uri.encodeComponent(id)}/thumbnail',
          'GET',
          [const QueryParam('size', 'thumbnail')],
          null,
          {'Cache-Control': 'no-store'},
          <String, String>{},
          'application/octet-stream',
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, 'Private preview unavailable');
    }
    return response.bodyBytes;
  }
}
