import 'package:immich_data/model/activity.dart';
import 'package:immich_data/server/api_repository.dart';
import 'package:immich_data/server/util/convert.dart';
import 'package:meta/meta.dart';
import 'package:openapi/api.dart';

/// Immich HTTP API for album activity (comments and likes)
class ActivityApiRepository extends ApiRepository {
  final ActivitiesApi _api;

  @internal
  const ActivityApiRepository(this._api);

  Future<List<Activity>> getAll(String albumId, {String? assetId}) async {
    final response = await checkNull(_api.getActivities(albumId, assetId: assetId));
    return response.map(_toActivity).toList();
  }

  Future<Activity> create(String albumId, ActivityType type, {String? assetId, String? comment}) async {
    final dto = ActivityCreateDto(
      albumId: albumId,
      type: type == ActivityType.comment ? ReactionType.comment : ReactionType.like,
      assetId: assetId == null ? const Optional.absent() : Optional.present(assetId),
      comment: comment == null ? const Optional.absent() : Optional.present(comment),
    );
    final response = await checkNull(_api.createActivity(dto));
    return _toActivity(response);
  }

  Future<void> delete(String id) {
    // TODO(agg23): I think this is a bug; `checkNull` will always throw here
    return checkNull(_api.deleteActivity(id));
  }

  static Activity _toActivity(ActivityResponseDto dto) => Activity(
    id: dto.id,
    createdAt: dto.createdAt,
    type: dto.type == ReactionType.comment ? ActivityType.comment : ActivityType.like,
    user: DtoConverter.toUser(dto.user),
    assetId: dto.assetId,
    comment: dto.comment.orElse(null),
  );
}
