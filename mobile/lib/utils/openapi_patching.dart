import 'package:openapi/api.dart';

dynamic upgradeDto(dynamic value, String targetType) {
  switch (targetType) {
    case 'UserPreferencesResponseDto':
      if (value is Map) {
        _addDefault(value, 'download.includeEmbeddedVideos', false);
        _addDefault(value, 'folders', FoldersResponse().toJson());
        _addDefault(value, 'memories', MemoriesResponse().toJson());
        _addDefault(value, 'ratings', RatingsResponse().toJson());
        _addDefault(value, 'people', PeopleResponse().toJson());
        _addDefault(value, 'tags', TagsResponse().toJson());
      }
      break;
  }
}

_addDefault(dynamic value, String keys, dynamic defaultValue) {
  // Loop through the keys and assign the default value if the key is not present
  List<String> keyList = keys.split('.');
  dynamic current = value;
  for (int i = 0; i < keyList.length; i++) {
    if (current[keyList[i]] == null) {
      current[keyList[i]] = defaultValue;
    }
    current = current[keyList[i]];
  }
}
