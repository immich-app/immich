import 'package:immich_mobile/entities/asset.entity.dart';

abstract interface class IAssetMediaRepository {
  Future<List<String>> deleteAll(List<String> ids);

  Future<Asset?> get(String id);
}
