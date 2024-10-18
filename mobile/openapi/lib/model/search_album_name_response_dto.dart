//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchAlbumNameResponseDto {
  /// Returns a new [SearchAlbumNameResponseDto] instance.
  SearchAlbumNameResponseDto({
    this.albums = const [],
    this.hasNextPage,
    this.total,
  });

  List<AlbumResponseDto> albums;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? hasNextPage;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchAlbumNameResponseDto &&
    _deepEquality.equals(other.albums, albums) &&
    other.hasNextPage == hasNextPage &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albums.hashCode) +
    (hasNextPage == null ? 0 : hasNextPage!.hashCode) +
    (total == null ? 0 : total!.hashCode);

  @override
  String toString() => 'SearchAlbumNameResponseDto[albums=$albums, hasNextPage=$hasNextPage, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albums'] = this.albums;
    if (this.hasNextPage != null) {
      json[r'hasNextPage'] = this.hasNextPage;
    } else {
    //  json[r'hasNextPage'] = null;
    }
    if (this.total != null) {
      json[r'total'] = this.total;
    } else {
    //  json[r'total'] = null;
    }
    return json;
  }

  /// Returns a new [SearchAlbumNameResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchAlbumNameResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SearchAlbumNameResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchAlbumNameResponseDto(
        albums: AlbumResponseDto.listFromJson(json[r'albums']),
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage'),
        total: mapValueOfType<int>(json, r'total'),
      );
    }
    return null;
  }

  static List<SearchAlbumNameResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchAlbumNameResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchAlbumNameResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchAlbumNameResponseDto> mapFromJson(dynamic json) {
    final map = <String, SearchAlbumNameResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchAlbumNameResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchAlbumNameResponseDto-objects as value to a dart map
  static Map<String, List<SearchAlbumNameResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchAlbumNameResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchAlbumNameResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albums',
  };
}

