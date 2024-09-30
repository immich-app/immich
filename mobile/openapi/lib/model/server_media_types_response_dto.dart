//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerMediaTypesResponseDto {
  /// Returns a new [ServerMediaTypesResponseDto] instance.
  ServerMediaTypesResponseDto({
    this.image = const [],
    this.sidecar = const [],
    this.video = const [],
  });

  List<String> image;

  List<String> sidecar;

  List<String> video;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerMediaTypesResponseDto &&
    _deepEquality.equals(other.image, image) &&
    _deepEquality.equals(other.sidecar, sidecar) &&
    _deepEquality.equals(other.video, video);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (image.hashCode) +
    (sidecar.hashCode) +
    (video.hashCode);

  @override
  String toString() => 'ServerMediaTypesResponseDto[image=$image, sidecar=$sidecar, video=$video]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'image'] = this.image;
      json[r'sidecar'] = this.sidecar;
      json[r'video'] = this.video;
    return json;
  }

  /// Returns a new [ServerMediaTypesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerMediaTypesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ServerMediaTypesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerMediaTypesResponseDto(
        image: json[r'image'] is Iterable
            ? (json[r'image'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        sidecar: json[r'sidecar'] is Iterable
            ? (json[r'sidecar'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        video: json[r'video'] is Iterable
            ? (json[r'video'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<ServerMediaTypesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerMediaTypesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerMediaTypesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerMediaTypesResponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerMediaTypesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerMediaTypesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerMediaTypesResponseDto-objects as value to a dart map
  static Map<String, List<ServerMediaTypesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerMediaTypesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerMediaTypesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'image',
    'sidecar',
    'video',
  };
}

