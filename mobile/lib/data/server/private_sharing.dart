import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/data/server/tag.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:openapi/api.dart';

typedef PrivateSharingSelection = ({List<String>? assetIds, String? linkId});

final privateSharingApiRepositoryProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  return PrivateSharingApiRepository(api.tagsApi, api.searchApi, api.sharedLinksApi);
});

final privateSharingPresenceProvider = FutureProvider.autoDispose.family<bool, PrivateSharingSelection>((
  ref,
  selection,
) {
  ref.watch(privateContentVisibleProvider);
  return ref.watch(privateSharingApiRepositoryProvider).hasPrivateAssets(selection);
});

class PrivateSharingApiRepository extends ApiRepository {
  const PrivateSharingApiRepository(this._tags, this._search, this._links);

  final TagsApi _tags;
  final SearchApi _search;
  final SharedLinksApi _links;

  Future<bool> hasPrivateAssets(PrivateSharingSelection selection) async {
    final assetIds =
        selection.assetIds ??
        (selection.linkId == null
            ? const <String>[]
            : (await checkNull(_links.getSharedLinkById(selection.linkId!))).assets.map((asset) => asset.id).toList());
    if (assetIds.isEmpty) {
      return false;
    }
    final tags = (await checkNull(_tags.getAllTags())).map(TagApiRepository.tagFromDto).toList();
    final privateIds = tags.where(tags.isEffectivelyPrivate).map((tag) => tag.id).toList();
    if (privateIds.isEmpty) {
      return false;
    }
    final result = await checkNull(
      _search.searchAssets(
        MetadataSearchDto(
          size: const Optional.present(1),
          filter: Optional.present(
            SearchFilter(
              or: Optional.present([
                for (final id in assetIds) SearchFilterBranch(id: Optional.present(IdFilter(eq: Optional.present(id)))),
              ]),
              tagIds: Optional.present(IdsFilter(any: Optional.present(privateIds))),
            ),
          ),
        ),
      ),
    );
    return result.assets.count > 0;
  }
}
