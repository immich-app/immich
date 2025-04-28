import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:openapi/api.dart';

abstract interface class ITagsApiRepository {
  Future<List<TagResponseDto>> getAllUniqueTags();
  Future<List<Asset>> getAssetsForPath(String path);
}
