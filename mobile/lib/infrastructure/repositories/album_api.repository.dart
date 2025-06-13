import 'package:immich_mobile/domain/interfaces/album_api.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AlbumApiRepository extends ApiRepository implements IAlbumApiRepository {
  final Logger _logger = Logger('AlbumApiRepository');
  final ApiService _api;
  AlbumApiRepository(this._api);

  @override
  Future<AlbumResponseDto?> createAlbum(
    String name,
    String? description,
    List<String> assetIds,
    List<AlbumUserCreateDto> albumUsers,
  ) async {
    return await checkNull(
      _api.albumsApi.createAlbum(
        CreateAlbumDto(
          albumName: name,
          description: description,
          assetIds: assetIds,
          albumUsers: albumUsers,
        ),
      ),
    );
  }

  @override
  Future<AlbumStatisticsResponseDto?> getAlbumStatistics() async {
    return await checkNull(
      _api.albumsApi.getAlbumStatistics(),
    );
  }

  @override
  Future<void> deleteAlbum(String id) async {
    return await _api.albumsApi.deleteAlbum(id);
  }
}
