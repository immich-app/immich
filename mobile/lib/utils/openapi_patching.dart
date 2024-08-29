import 'package:openapi/api.dart';

dynamic upgradeDto(dynamic value, String targetType) {
  switch (targetType) {
    case 'UserPreferencesResponseDto':
      if (value is Map) {
        if (value['download']['includeEmbeddedVideos'] == null) {
          value['download']['includeEmbeddedVideos'] = false;
        }

        // v1.113.0
        if (value['folders'] == null) {
          value['folders'] = FoldersResponse().toJson();
        }

        if (value['memories'] == null) {
          value['memories'] = MemoriesResponse().toJson();
        }

        if (value['ratings'] == null) {
          value['ratings'] = RatingsResponse().toJson();
        }

        if (value['people'] == null) {
          value['people'] = PeopleResponse().toJson();
        }

        if (value['tags'] == null) {
          value['tags'] = TagsResponse().toJson();
        }
      }
      break;
  }
}
