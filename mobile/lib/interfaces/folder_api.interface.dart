import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

abstract interface class IFolderApiRepository {
  Future<AsyncValue<List<String>>> getAllUniquePaths();
  Future<AsyncValue<List<Asset>>> getAssetsForPath(String? path);
}
