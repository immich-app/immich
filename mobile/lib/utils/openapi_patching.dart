import 'package:openapi/api.dart';

dynamic upgradeDto(dynamic value, String targetType) {
  switch (targetType) {
    case 'UserPreferencesResponseDto':
      if (value is Map) {
        if (value['rating'] == null) {
          value['rating'] = RatingResponse(enabled: false).toJson();
        }
      }
  }

  return value;
}
