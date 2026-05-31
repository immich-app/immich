import 'package:openapi/api.dart';

/// Registers backward-compatibility back-fills so the generated client tolerates
/// responses from older Immich servers (fields newer DTOs expect but older
/// servers omit). Call once at startup, before any API request.
///
/// The mechanism ([ApiCompat]) lives in the generated client; the rules live
/// here because the defaults are app/server-version knowledge. Keyed by DTO
/// type, so a renamed or removed DTO is a compile error. Static-only rule lists
/// are `const`; lists using a DTO's `toJson()` or `DateTime.now()` are built at
/// startup.
void configureOpenApiCompat() {
  ApiCompat.configure({
    UserPreferencesResponseDto: [
      const .new('download.includeEmbeddedVideos', false),
      .new('folders', const FoldersResponse(enabled: false, sidebarWeb: false).toJson()),
      .new('memories', const MemoriesResponse(enabled: true, duration: 5).toJson()),
      .new('ratings', const RatingsResponse(enabled: false).toJson()),
      .new('people', const PeopleResponse(enabled: true, sidebarWeb: false).toJson()),
      .new('tags', const TagsResponse(enabled: false, sidebarWeb: false).toJson()),
      .new('sharedLinks', const SharedLinksResponse(enabled: true, sidebarWeb: false).toJson()),
      .new('cast', const CastResponse(gCastEnabled: false).toJson()),
      const .new('albums', {'defaultAssetOrder': 'desc'}),
    ],
    ServerConfigDto: const [
      .new('mapLightStyleUrl', 'https://tiles.immich.cloud/v1/style/light.json'),
      .new('mapDarkStyleUrl', 'https://tiles.immich.cloud/v1/style/dark.json'),
    ],
    UserResponseDto: [.new('profileChangedAt', DateTime.now().toIso8601String())],
    AssetResponseDto: [
      const .new('visibility', 'timeline'),
      .new('createdAt', DateTime.now().toIso8601String()),
      const .new('isEdited', false),
    ],
    UserAdminResponseDto: [.new('profileChangedAt', DateTime.now().toIso8601String())],
    LoginResponseDto: const [.new('isOnboarded', false)],
    SyncUserV1: [.new('profileChangedAt', DateTime.now().toIso8601String()), const .new('hasProfileImage', false)],
    SyncAssetV1: const [.new('isEdited', false)],
    ServerFeaturesDto: const [.new('ocr', false)],
    MemoriesResponse: const [.new('duration', 5)],
  });
}
