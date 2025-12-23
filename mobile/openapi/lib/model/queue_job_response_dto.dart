//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueJobResponseDto {
  /// Returns a new [QueueJobResponseDto] instance.
  QueueJobResponseDto({
    required this.data,
    this.id,
    required this.name,
    required this.timestamp,
  });

  Object data;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? id;

  JobName name;

  int timestamp;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueJobResponseDto &&
    other.data == data &&
    other.id == id &&
    other.name == name &&
    other.timestamp == timestamp;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data.hashCode) +
    (id == null ? 0 : id!.hashCode) +
    (name.hashCode) +
    (timestamp.hashCode);

  @override
  String toString() => 'QueueJobResponseDto[data=$data, id=$id, name=$name, timestamp=$timestamp]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'data'] = this.data;
    if (this.id != null) {
      json[r'id'] = this.id;
    } else {
    //  json[r'id'] = null;
    }
      json[r'name'] = this.name;
      json[r'timestamp'] = this.timestamp;
    return json;
  }

  /// Returns a new [QueueJobResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueJobResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueJobResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueJobResponseDto(
        data: mapValueOfType<Object>(json, r'data')!,
        id: mapValueOfType<String>(json, r'id'),
        name: JobName.fromJson(json[r'name'])!,
        timestamp: mapValueOfType<int>(json, r'timestamp')!,
      );
    }
    return null;
  }

  static List<QueueJobResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueJobResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueJobResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueJobResponseDto> mapFromJson(dynamic json) {
    final map = <String, QueueJobResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueJobResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueJobResponseDto-objects as value to a dart map
  static Map<String, List<QueueJobResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueJobResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueJobResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'data',
    'name',
    'timestamp',
  };
}

