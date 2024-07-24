//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DownloadResponseDto {
  /// Returns a new [DownloadResponseDto] instance.
  DownloadResponseDto({
    this.archives = const [],
    required this.totalSize,
  });

  List<DownloadArchiveInfo> archives;

  int totalSize;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DownloadResponseDto &&
    _deepEquality.equals(other.archives, archives) &&
    other.totalSize == totalSize;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (archives.hashCode) +
    (totalSize.hashCode);

  @override
  String toString() => 'DownloadResponseDto[archives=$archives, totalSize=$totalSize]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'archives'] = this.archives;
      json[r'totalSize'] = this.totalSize;
    return json;
  }

  /// Returns a new [DownloadResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DownloadResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DownloadResponseDto(
        archives: DownloadArchiveInfo.listFromJson(json[r'archives']),
        totalSize: mapValueOfType<int>(json, r'totalSize')!,
      );
    }
    return null;
  }

  static List<DownloadResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DownloadResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DownloadResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DownloadResponseDto> mapFromJson(dynamic json) {
    final map = <String, DownloadResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DownloadResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DownloadResponseDto-objects as value to a dart map
  static Map<String, List<DownloadResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DownloadResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DownloadResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'archives',
    'totalSize',
  };
}

