//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AddAssetsResponseDto {
  /// Returns a new [AddAssetsResponseDto] instance.
  AddAssetsResponseDto({
    required this.successfullyAdded,
    this.alreadyInAlbum = const [],
    this.album,
  });

  int successfullyAdded;

  List<String> alreadyInAlbum;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AlbumResponseDto? album;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AddAssetsResponseDto &&
     other.successfullyAdded == successfullyAdded &&
     other.alreadyInAlbum == alreadyInAlbum &&
     other.album == album;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (successfullyAdded.hashCode) +
    (alreadyInAlbum.hashCode) +
    (album == null ? 0 : album!.hashCode);

  @override
  String toString() => 'AddAssetsResponseDto[successfullyAdded=$successfullyAdded, alreadyInAlbum=$alreadyInAlbum, album=$album]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'successfullyAdded'] = this.successfullyAdded;
      json[r'alreadyInAlbum'] = this.alreadyInAlbum;
    if (this.album != null) {
      json[r'album'] = this.album;
    } else {
      // json[r'album'] = null;
    }
    return json;
  }

  /// Returns a new [AddAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AddAssetsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AddAssetsResponseDto[$key]" is missing from JSON.');
          // assert(json[key] != null, 'Required key "AddAssetsResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AddAssetsResponseDto(
        successfullyAdded: mapValueOfType<int>(json, r'successfullyAdded')!,
        alreadyInAlbum: json[r'alreadyInAlbum'] is Iterable
            ? (json[r'alreadyInAlbum'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        album: AlbumResponseDto.fromJson(json[r'album']),
      );
    }
    return null;
  }

  static List<AddAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AddAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AddAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AddAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, AddAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AddAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AddAssetsResponseDto-objects as value to a dart map
  static Map<String, List<AddAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AddAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AddAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'successfullyAdded',
    'alreadyInAlbum',
  };
}

