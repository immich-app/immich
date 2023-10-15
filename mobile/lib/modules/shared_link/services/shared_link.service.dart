import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final sharedLinkServiceProvider = Provider(
  (ref) => SharedLinkService(ref.watch(apiServiceProvider)),
);

class SharedLinkService {
  final ApiService _apiService;
  final Logger _log = Logger("SharedLinkService");

  SharedLinkService(this._apiService);

  Future<AsyncValue<List<SharedLinkResponseDto>>> getAllSharedLinks() async {
    try {
      final list = await _apiService.sharedLinkApi.getAllSharedLinks();
      return list != null ? AsyncData(list) : const AsyncData([]);
    } catch (e, stack) {
      _log.severe("failed to fetch shared links - $e");
      return AsyncError(e, stack);
    }
  }

  Future<void> deleteSharedLink(String id) async {
    try {
      return await _apiService.sharedLinkApi.removeSharedLink(id);
    } catch (e) {
      _log.severe("failed to delete shared link id - $id with error - $e");
    }
  }

  Future<void> createSharedLink(SharedLinkCreateDto dto) async {
    try {
      await _apiService.sharedLinkApi.createSharedLink(dto);
    } catch (e) {
      _log.severe("failed to update shared link id with error - $e");
    }
  }

  Future<void> updateSharedLink(String id, SharedLinkEditDto dto) async {
    try {
      await _apiService.sharedLinkApi.updateSharedLink(id, dto);
    } catch (e) {
      _log.severe("failed to update shared link id - $id with error - $e");
    }
  }
}
