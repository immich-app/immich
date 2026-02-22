import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart' hide AssetEditAction;

final assetApiRepositoryProvider = Provider(
  (ref) => AssetApiRepository(
    ref.watch(apiServiceProvider).assetsApi,
    ref.watch(apiServiceProvider).searchApi,
    ref.watch(apiServiceProvider).stacksApi,
    ref.watch(apiServiceProvider).trashApi,
  ),
);

class AssetApiRepository extends ApiRepository {
  final AssetsApi _api;
  final SearchApi _searchApi;
  final StacksApi _stacksApi;
  final TrashApi _trashApi;

  AssetApiRepository(this._api, this._searchApi, this._stacksApi, this._trashApi);

  Future<Asset> update(String id, {String? description}) async {
    final response = await checkNull(_api.updateAsset(id, UpdateAssetDto(description: description)));
    return Asset.remote(response);
  }

  Future<List<Asset>> search({List<String> personIds = const []}) async {
    // TODO this always fetches all assets, change API and usage to actually do pagination
    final List<Asset> result = [];
    bool hasNext = true;
    int currentPage = 1;
    while (hasNext) {
      final response = await checkNull(
        _searchApi.searchAssets(MetadataSearchDto(personIds: personIds, page: currentPage, size: 1000)),
      );
      result.addAll(response.assets.items.map(Asset.remote));
      hasNext = response.assets.nextPage != null;
      currentPage++;
    }
    return result;
  }

  Future<void> delete(List<String> ids, bool force) async {
    return _api.deleteAssets(AssetBulkDeleteDto(ids: ids, force: force));
  }

  Future<void> restoreTrash(List<String> ids) async {
    await _trashApi.restoreAssets(BulkIdsDto(ids: ids));
  }

  Future<void> updateVisibility(List<String> ids, AssetVisibilityEnum visibility) async {
    return _api.updateAssets(AssetBulkUpdateDto(ids: ids, visibility: _mapVisibility(visibility)));
  }

  Future<void> updateFavorite(List<String> ids, bool isFavorite) async {
    return _api.updateAssets(AssetBulkUpdateDto(ids: ids, isFavorite: isFavorite));
  }

  Future<void> updateLocation(List<String> ids, LatLng location) async {
    return _api.updateAssets(AssetBulkUpdateDto(ids: ids, latitude: location.latitude, longitude: location.longitude));
  }

  Future<void> updateDateTime(List<String> ids, DateTime dateTime) async {
    return _api.updateAssets(AssetBulkUpdateDto(ids: ids, dateTimeOriginal: dateTime.toIso8601String()));
  }

  Future<StackResponse> stack(List<String> ids) async {
    final responseDto = await checkNull(_stacksApi.createStack(StackCreateDto(assetIds: ids)));

    return responseDto.toStack();
  }

  Future<void> unStack(List<String> ids) async {
    return _stacksApi.deleteStacks(BulkIdsDto(ids: ids));
  }

  Future<Response> downloadAsset(String id, {required bool edited}) {
    return _api.downloadAssetWithHttpInfo(id, edited: edited);
  }

  _mapVisibility(AssetVisibilityEnum visibility) => switch (visibility) {
    AssetVisibilityEnum.timeline => AssetVisibility.timeline,
    AssetVisibilityEnum.hidden => AssetVisibility.hidden,
    AssetVisibilityEnum.locked => AssetVisibility.locked,
    AssetVisibilityEnum.archive => AssetVisibility.archive,
  };

  Future<String?> getAssetMIMEType(String assetId) async {
    final response = await checkNull(_api.getAssetInfo(assetId));

    // we need to get the MIME of the thumbnail once that gets added to the API
    return response.originalMimeType;
  }

  Future<void> updateDescription(String assetId, String description) {
    return _api.updateAsset(assetId, UpdateAssetDto(description: description));
  }

  Future<void> updateRating(String assetId, int rating) {
    return _api.updateAsset(assetId, UpdateAssetDto(rating: rating));
  }

  Future<void> editAsset(String assetId, List<AssetEdit> edits) async {
    final editDtos = edits
        .map((edit) {
          if (edit.action == AssetEditAction.other) {
            return null;
          }

          return AssetEditActionListDtoEditsInner(action: edit.action.toDto()!, parameters: edit.parameters);
        })
        .whereType<AssetEditActionListDtoEditsInner>()
        .toList();

    await _api.editAsset(assetId, AssetEditActionListDto(edits: editDtos));
  }

  Future<void> removeEdits(String assetId) async {
    await _api.removeAssetEdits(assetId);
  }
}

extension on StackResponseDto {
  StackResponse toStack() {
    return StackResponse(id: id, primaryAssetId: primaryAssetId, assetIds: assets.map((asset) => asset.id).toList());
  }
}
