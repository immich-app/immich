import 'package:openapi/api.dart';

dynamic upgradeDto(dynamic value, String targetType) {
  switch (targetType) {
    case 'UserPreferencesResponseDto':
      if (value is Map) {
        if (value['rating'] == null) {
          value['rating'] = RatingResponse().toJson();
        }

        if (value['download']['includeEmbeddedVideos'] == null) {
          value['download']['includeEmbeddedVideos'] = false;
        }

        // v1.113.0
        if (value['metadata'] == null) {
          value['metadata'] = {};

          value['metadata']['memory'] = {};
          value['metadata']['memory']['enabled'] = true;

          value['metadata']['rating'] = {};
          value['metadata']['rating']['enabled'] = false;

          value['metadata']['folder'] = {};
          value['metadata']['folder']['enabled'] = false;

          value['metadata']['tag'] = {};
          value['metadata']['tag']['enabled'] = false;

          value['metadata']['people'] = {};
          value['metadata']['people']['enabled'] = false;
        }
      }
      break;
  }
}
