import 'package:openapi/api.dart';

abstract interface class IAlbumApiRepository {
  Future<AlbumResponseDto?> createAlbum(
    String name,
    String? description,
    List<String> assetIds,
    List<AlbumUserCreateDto> albumUsers,
  );

  Future<AlbumStatisticsResponseDto?> getAlbumStatistics();

  Future<void> deleteAlbum(String id);
}
