import 'package:immich_mobile/entities/etag.entity.dart';

abstract interface class IETagRepository {
  Future<ETag?> get(int id);

  Future<ETag?> getById(String id);

  Future<List<String>> getAllIds();

  Future<void> upsertAll(List<ETag> etags);

  Future<void> deleteByIds(List<String> ids);
}
