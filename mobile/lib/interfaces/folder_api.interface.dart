import 'package:immich_mobile/entities/asset.entity.dart';

abstract interface class IFolderApiRepository {
  Future<List<String>> getAllUniquePaths();
  Future<List<Asset>> getAssetsForPath(String? path);
}
