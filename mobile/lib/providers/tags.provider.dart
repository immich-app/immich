import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/tags/root_tag.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/folder.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:immich_mobile/services/api.service.dart';

final getAllTagsProvider =
    FutureProvider.autoDispose<List<TagResponseDto>>((ref) async {
  final ApiService searchService = ref.watch(apiServiceProvider);

  final assetTags = await searchService.tagsApi.getAllTags();

  if (assetTags == null) {
    return [];
  }

  return assetTags;
});

class TagsNotifier extends StateNotifier<AsyncValue<List<TagResponseDto>>> {
  final ApiService _apiService;
  final Logger _log = Logger("FolderStructureNotifier");

  TagsNotifier(this._apiService) : super(const AsyncLoading());

  Future<void> fetchTags() async {
    try {
      final tags = await _apiService.tagsApi.getAllTags();
      state = AsyncData(tags ?? []);
    } catch (e, stack) {
      _log.severe("Failed to fetch tags", e, stack);
      state = AsyncError(e, stack);
    }
  }
}

final tagsProvider =
    StateNotifierProvider<TagsNotifier, AsyncValue<List<TagResponseDto>>>(
        (ref) {
  return TagsNotifier(
    ref.watch(apiServiceProvider),
  );
});

class TagsRenderListNotifier extends StateNotifier<AsyncValue<RenderList>> {
  final ApiService _apiService;
  final TagResponseDto? _tag;
  final Logger _log = Logger("TagsRenderListNotifier");

  TagsRenderListNotifier(this._apiService, this._tag)
      : super(const AsyncLoading());

  Future<void> fetchAssets() async {
    try {
      if (_tag == null) {
      } else {
        final results = await _apiService.searchApi
            .searchAssets(MetadataSearchDto(tagIds: [_tag!.id]));
        final assets =
            (results?.assets.items ?? []).map((x) => Asset.remote(x)).toList();
        final renderList =
            await RenderList.fromAssets(assets, GroupAssetsBy.none);
        state = AsyncData(renderList);
      }
    } catch (e, stack) {
      _log.severe("Failed to fetch tag assets", e, stack);
      state = AsyncError(e, stack);
    }
  }
}

final tagsRenderListProvider = StateNotifierProvider.family<
    TagsRenderListNotifier,
    AsyncValue<RenderList>,
    TagResponseDto?>((ref, folder) {
  return TagsRenderListNotifier(
    ref.watch(apiServiceProvider),
    folder,
  );
});
