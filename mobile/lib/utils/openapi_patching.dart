import 'package:flutter/foundation.dart';
import 'package:openapi/api.dart';

abstract interface class _Dynamic {
  Object? resolve();
}

class _CurrentTimestamp implements _Dynamic {
  const _CurrentTimestamp();

  @override
  Object? resolve() => DateTime.now().toIso8601String();
}

const _now = _CurrentTimestamp();

@visibleForTesting
final Map<String, Map<String, Object?>> openApiPatches = {
  'UserPreferencesResponseDto': {
    'download.includeEmbeddedVideos': false,
    'folders': FoldersResponse(enabled: false, sidebarWeb: false).toJson(),
    'memories': MemoriesResponse(enabled: true, duration: 5).toJson(),
    'ratings': RatingsResponse(enabled: false).toJson(),
    'people': PeopleResponse(enabled: true, sidebarWeb: false).toJson(),
    'tags': TagsResponse(enabled: false, sidebarWeb: false).toJson(),
    'sharedLinks': SharedLinksResponse(enabled: true, sidebarWeb: false).toJson(),
    'cast': CastResponse(gCastEnabled: false).toJson(),
    'albums': {'defaultAssetOrder': 'desc'},
    'recentlyAdded': RecentlyAddedResponse(sidebarWeb: false).toJson(),
  },
  'ServerConfigDto': {
    'mapLightStyleUrl': 'https://tiles.immich.cloud/v1/style/light.json',
    'mapDarkStyleUrl': 'https://tiles.immich.cloud/v1/style/dark.json',
    'minFaces': 3,
  },
  'UserResponseDto': {'profileChangedAt': _now},
  'AssetResponseDto': {'visibility': 'timeline', 'createdAt': _now, 'isEdited': false},
  'UserAdminResponseDto': {'profileChangedAt': _now},
  'LoginResponseDto': {'isOnboarded': false},
  'SyncUserV1': {'profileChangedAt': _now, 'hasProfileImage': false},
  'SyncAssetV1': {'isEdited': false},
  'ServerFeaturesDto': {'ocr': false, 'realtimeTranscoding': false},
  'MemoriesResponse': {'duration': 5},
  'WorkflowResponseDto': {'logging': false},
};

void upgradeDto(dynamic value, String targetType) {
  if (value is! Map) {
    return;
  }
  final fields = openApiPatches[targetType];
  if (fields == null) {
    return;
  }
  fields.forEach((key, defaultValue) {
    addDefault(value, key, defaultValue is _Dynamic ? defaultValue.resolve() : defaultValue);
  });
}

addDefault(dynamic value, String keys, dynamic defaultValue) {
  // Loop through the keys and assign the default value if the key is not present
  List<String> keyList = keys.split('.');
  dynamic current = value;

  for (int i = 0; i < keyList.length - 1; i++) {
    if (current[keyList[i]] == null) {
      current[keyList[i]] = {};
    }
    current = current[keyList[i]];
  }

  if (current[keyList.last] == null) {
    current[keyList.last] = defaultValue;
  }
}
