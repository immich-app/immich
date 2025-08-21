//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TestEmailResponseDto {
  /// Returns a new [TestEmailResponseDto] instance.
  TestEmailResponseDto({
    required this.messageId,
  });

  String messageId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TestEmailResponseDto &&
    other.messageId == messageId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (messageId.hashCode);

  @override
  String toString() => 'TestEmailResponseDto[messageId=$messageId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'messageId'] = this.messageId;
    return json;
  }

  /// Returns a new [TestEmailResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TestEmailResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TestEmailResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TestEmailResponseDto(
        messageId: mapValueOfType<String>(json, r'messageId')!,
      );
    }
    return null;
  }

  static List<TestEmailResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TestEmailResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TestEmailResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TestEmailResponseDto> mapFromJson(dynamic json) {
    final map = <String, TestEmailResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TestEmailResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TestEmailResponseDto-objects as value to a dart map
  static Map<String, List<TestEmailResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TestEmailResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TestEmailResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'messageId',
  };
}

