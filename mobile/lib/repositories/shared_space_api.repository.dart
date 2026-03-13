import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final sharedSpaceApiRepositoryProvider = Provider(
  (ref) => SharedSpaceApiRepository(
    ref.watch(apiServiceProvider).sharedSpacesApi,
    ref.watch(apiServiceProvider).timelineApi,
  ),
);

class SharedSpaceApiRepository extends ApiRepository {
  final SharedSpacesApi _api;
  final TimelineApi _timelineApi;

  SharedSpaceApiRepository(this._api, this._timelineApi);

  Future<List<SharedSpaceResponseDto>> getAll() async {
    final response = await checkNull(_api.getAllSpaces());
    return response;
  }

  Future<SharedSpaceResponseDto> get(String id) async {
    return await checkNull(_api.getSpace(id));
  }

  Future<SharedSpaceResponseDto> create(String name, {String? description}) async {
    final dto = SharedSpaceCreateDto(name: name, description: description);
    return await checkNull(_api.createSpace(dto));
  }

  Future<void> delete(String id) => _api.removeSpace(id);

  Future<List<SharedSpaceMemberResponseDto>> getMembers(String id) async {
    final response = await checkNull(_api.getMembers(id));
    return response;
  }

  Future<SharedSpaceMemberResponseDto> addMember(
    String spaceId,
    String userId, {
    SharedSpaceRole role = SharedSpaceRole.viewer,
  }) async {
    final dto = SharedSpaceMemberCreateDto(userId: userId, role: role);
    return await checkNull(_api.addMember(spaceId, dto));
  }

  Future<void> removeMember(String spaceId, String userId) => _api.removeMember(spaceId, userId);

  Future<SharedSpaceMemberResponseDto> updateMember(String spaceId, String userId, SharedSpaceRole role) async {
    final dto = SharedSpaceMemberUpdateDto(role: role);
    return await checkNull(_api.updateMember(spaceId, userId, dto));
  }

  Future<SharedSpaceMemberResponseDto> updateMemberTimeline(String spaceId, {required bool showInTimeline}) async {
    final dto = SharedSpaceMemberTimelineDto(showInTimeline: showInTimeline);
    return await checkNull(_api.updateMemberTimeline(spaceId, dto));
  }

  Future<void> addAssets(String spaceId, List<String> assetIds) async {
    final dto = SharedSpaceAssetAddDto(assetIds: assetIds);
    await _api.addAssets(spaceId, dto);
  }

  Future<void> removeAssets(String spaceId, List<String> assetIds) async {
    final dto = SharedSpaceAssetRemoveDto(assetIds: assetIds);
    await _api.removeAssets(spaceId, dto);
  }

  /// Fetches all assets in a space via the timeline API.
  Future<List<RemoteAsset>> getSpaceAssets(String spaceId) async {
    final buckets = await _timelineApi.getTimeBuckets(spaceId: spaceId);
    if (buckets == null || buckets.isEmpty) return [];

    final allAssets = <RemoteAsset>[];
    for (final bucket in buckets) {
      final bucketData = await _timelineApi.getTimeBucket(bucket.timeBucket, spaceId: spaceId);
      if (bucketData == null) continue;

      for (int i = 0; i < bucketData.id.length; i++) {
        allAssets.add(
          RemoteAsset(
            id: bucketData.id[i],
            name: bucketData.id[i],
            ownerId: bucketData.ownerId[i],
            checksum: '',
            type: bucketData.isImage[i] ? AssetType.image : AssetType.video,
            createdAt: DateTime.parse(bucketData.fileCreatedAt[i]),
            updatedAt: DateTime.parse(bucketData.fileCreatedAt[i]),
            isFavorite: bucketData.isFavorite[i],
            thumbHash: bucketData.thumbhash[i],
            livePhotoVideoId: bucketData.livePhotoVideoId[i],
            isEdited: false,
            durationInSeconds: _parseDuration(bucketData.duration[i]),
          ),
        );
      }
    }

    return allAssets;
  }

  int? _parseDuration(String? duration) {
    if (duration == null || duration == '0:00:00.00000') return null;
    final parts = duration.split(':');
    if (parts.length != 3) return null;
    final hours = int.tryParse(parts[0]) ?? 0;
    final minutes = int.tryParse(parts[1]) ?? 0;
    final secondParts = parts[2].split('.');
    final seconds = int.tryParse(secondParts[0]) ?? 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
}
