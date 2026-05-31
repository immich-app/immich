import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/openapi_compat.dart';
import 'package:openapi/api.dart';

void main() {
  setUp(configureOpenApiCompat);
  tearDown(ApiCompat.reset);

  group('configureOpenApiCompat', () {
    test('back-fills nested and scalar defaults for an older server', () {
      final json = <String, dynamic>{};
      ApiCompat.upgrade<UserPreferencesResponseDto>(json);

      expect((json['download'] as Map)['includeEmbeddedVideos'], false);
      expect(json['folders'], {'enabled': false, 'sidebarWeb': false});
      expect(json['albums'], {'defaultAssetOrder': 'desc'});
    });

    test('never overwrites values the server actually sent', () {
      final json = <String, dynamic>{'isEdited': true, 'visibility': 'archive'};
      ApiCompat.upgrade<AssetResponseDto>(json);

      expect(json['isEdited'], true);
      expect(json['visibility'], 'archive');
    });

    test('timestamp default fills a parseable value', () {
      final json = <String, dynamic>{};
      ApiCompat.upgrade<UserResponseDto>(json);

      expect(json['profileChangedAt'], isA<String>());
      expect(DateTime.tryParse(json['profileChangedAt'] as String), isNotNull);
    });

    test('a type with no registered rules is a no-op', () {
      final json = <String, dynamic>{};
      ApiCompat.upgrade<AlbumResponseDto>(json);
      expect(json, isEmpty);
    });
  });
}
