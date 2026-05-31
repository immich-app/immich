import 'package:collection/collection.dart';

void upgradeDto(dynamic value, String type) {}

enum AlbumUserRole {
  editor._(r'editor'),
  viewer._(r'viewer'),
  valueUnknown._(r'__unknown__');

  const AlbumUserRole._(this.value);
  final String value;
  static AlbumUserRole? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }
  Object toJson() => value;
}

class UserLicense {}
