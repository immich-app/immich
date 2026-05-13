//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BulkIdResponseDto {
  /// Returns a new [BulkIdResponseDto] instance.
  BulkIdResponseDto({
    this.error,
    this.errorMessage,
    required this.id,
    required this.success,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  BulkIdErrorReason? error;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? errorMessage;

  /// ID
  String id;

  /// Whether operation succeeded
  bool success;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BulkIdResponseDto &&
    other.error == error &&
    other.errorMessage == errorMessage &&
    other.id == id &&
    other.success == success;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (error == null ? 0 : error!.hashCode) +
    (errorMessage == null ? 0 : errorMessage!.hashCode) +
    (id.hashCode) +
    (success.hashCode);

  @override
  String toString() => 'BulkIdResponseDto[error=$error, errorMessage=$errorMessage, id=$id, success=$success]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
    if (this.errorMessage != null) {
      json[r'errorMessage'] = this.errorMessage;
    } else {
    //  json[r'errorMessage'] = null;
    }
      json[r'id'] = this.id;
      json[r'success'] = this.success;
    return json;
  }

  /// Returns a new [BulkIdResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BulkIdResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "BulkIdResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return BulkIdResponseDto(
        error: BulkIdErrorReason.fromJson(json[r'error']),
        errorMessage: mapValueOfType<String>(json, r'errorMessage'),
        id: mapValueOfType<String>(json, r'id')!,
        success: mapValueOfType<bool>(json, r'success')!,
      );
    }
    return null;
  }

  static List<BulkIdResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BulkIdResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BulkIdResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BulkIdResponseDto> mapFromJson(dynamic json) {
    final map = <String, BulkIdResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BulkIdResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BulkIdResponseDto-objects as value to a dart map
  static Map<String, List<BulkIdResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BulkIdResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BulkIdResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'success',
  };
}

