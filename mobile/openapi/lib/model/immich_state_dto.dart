//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImmichStateDto {
  /// Returns a new [ImmichStateDto] instance.
  ImmichStateDto({
    this.dataFolders = const [],
    required this.dataPath,
    this.libraries = const [],
  });

  List<String> dataFolders;

  String dataPath;

  List<ImmichLibraryDto> libraries;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImmichStateDto &&
    _deepEquality.equals(other.dataFolders, dataFolders) &&
    other.dataPath == dataPath &&
    _deepEquality.equals(other.libraries, libraries);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dataFolders.hashCode) +
    (dataPath.hashCode) +
    (libraries.hashCode);

  @override
  String toString() => 'ImmichStateDto[dataFolders=$dataFolders, dataPath=$dataPath, libraries=$libraries]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'dataFolders'] = this.dataFolders;
      json[r'dataPath'] = this.dataPath;
      json[r'libraries'] = this.libraries;
    return json;
  }

  /// Returns a new [ImmichStateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImmichStateDto? fromJson(dynamic value) {
    upgradeDto(value, "ImmichStateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImmichStateDto(
        dataFolders: json[r'dataFolders'] is Iterable
            ? (json[r'dataFolders'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        dataPath: mapValueOfType<String>(json, r'dataPath')!,
        libraries: ImmichLibraryDto.listFromJson(json[r'libraries']),
      );
    }
    return null;
  }

  static List<ImmichStateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImmichStateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImmichStateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImmichStateDto> mapFromJson(dynamic json) {
    final map = <String, ImmichStateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImmichStateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImmichStateDto-objects as value to a dart map
  static Map<String, List<ImmichStateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImmichStateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImmichStateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'dataFolders',
    'dataPath',
    'libraries',
  };
}

