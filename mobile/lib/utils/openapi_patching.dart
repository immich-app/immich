import 'package:openapi/api.dart';

dynamic upgradeDto(dynamic value, String targetType) {
  switch (targetType) {
    case 'UserPreferencesResponseDto':
      if (value is Map) {
        addDefault(value, 'download.includeEmbeddedVideos', false);
        addDefault(value, 'folders', FoldersResponse().toJson());
        addDefault(value, 'memories', MemoriesResponse().toJson());
        addDefault(value, 'ratings', RatingsResponse().toJson());
        addDefault(value, 'people', PeopleResponse().toJson());
        addDefault(value, 'tags', TagsResponse().toJson());
      }
      break;
  }
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
