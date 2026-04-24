import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

final sharedSpaceApiRepositoryProvider = Provider((ref) => SharedSpaceApiRepository(ref.watch(apiServiceProvider)));

class SharedSpaceApiRepository extends ApiRepository {
  final ApiService _apiService;

  SharedSpaceApiRepository(this._apiService);

  // Resolved lazily on each call. `ApiService.setEndpoint()` reassigns the
  // `*Api` fields to new instances tied to a fresh ApiClient (and basePath);
  // capturing `sharedSpacesApi` once would pin this repo to a stale client if
  // the provider is first read before login (e.g. from the deep-link graph at
  // cold start).
  SharedSpacesApi get _api => _apiService.sharedSpacesApi;

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

  Future<void> delete(String id) async {
    await _api.removeSpace(id);
  }

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

  Future<void> removeMember(String spaceId, String userId) async {
    await _api.removeMember(spaceId, userId);
  }

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
}
