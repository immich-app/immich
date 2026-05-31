// Reference app-side code for the generator's `ApiCompat` mechanism.
//
// During the client swap this replaces `mobile/lib/utils/openapi_patching.dart`
// (drop it at e.g. `mobile/lib/utils/openapi_compat.dart`) and the app calls
// `configureOpenApiCompat()` once during startup, before any API request.
//
// Keyed by DTO type (a renamed/removed DTO is a compile error). Static-only
// rule lists are `const`; the mechanism lives in the generated client, the
// defaults — app/server-version knowledge — live here.
//
// ignore_for_file: prefer_const_constructors
import 'package:openapi/api.dart';

void configureOpenApiCompat() {
  ApiCompat.configure({
    UserPreferencesResponseDto: [
      JsonDefault('download.includeEmbeddedVideos', false),
      JsonDefault('folders', FoldersResponse(enabled: false, sidebarWeb: false).toJson()),
      JsonDefault('memories', MemoriesResponse(enabled: true, duration: 5).toJson()),
      JsonDefault('ratings', RatingsResponse(enabled: false).toJson()),
      JsonDefault('people', PeopleResponse(enabled: true, sidebarWeb: false).toJson()),
      JsonDefault('tags', TagsResponse(enabled: false, sidebarWeb: false).toJson()),
      JsonDefault('sharedLinks', SharedLinksResponse(enabled: true, sidebarWeb: false).toJson()),
      JsonDefault('cast', CastResponse(gCastEnabled: false).toJson()),
      JsonDefault('albums', {'defaultAssetOrder': 'desc'}),
    ],
    ServerConfigDto: const [
      JsonDefault('mapLightStyleUrl', 'https://tiles.immich.cloud/v1/style/light.json'),
      JsonDefault('mapDarkStyleUrl', 'https://tiles.immich.cloud/v1/style/dark.json'),
    ],
    UserResponseDto: [JsonDefault('profileChangedAt', DateTime.now().toIso8601String())],
    AssetResponseDto: [
      JsonDefault('visibility', 'timeline'),
      JsonDefault('createdAt', DateTime.now().toIso8601String()),
      JsonDefault('isEdited', false),
    ],
    UserAdminResponseDto: [JsonDefault('profileChangedAt', DateTime.now().toIso8601String())],
    LoginResponseDto: const [JsonDefault('isOnboarded', false)],
    SyncUserV1: [
      JsonDefault('profileChangedAt', DateTime.now().toIso8601String()),
      JsonDefault('hasProfileImage', false),
    ],
    SyncAssetV1: const [JsonDefault('isEdited', false)],
    ServerFeaturesDto: const [JsonDefault('ocr', false)],
    MemoriesResponse: const [JsonDefault('duration', 5)],
  });
}
