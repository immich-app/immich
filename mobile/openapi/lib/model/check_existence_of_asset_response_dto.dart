//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CheckExistenceOfAssetResponseDto {
  /// Returns a new [CheckExistenceOfAssetResponseDto] instance.
  CheckExistenceOfAssetResponseDto({
    required this.id,
    required this.clientId,
    required this.action,
    this.reason,
  });

  String id;

  String clientId;

  CheckExistenceOfAssetResponseDtoActionEnum action;

  CheckExistenceOfAssetResponseDtoReasonEnum? reason;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CheckExistenceOfAssetResponseDto &&
     other.id == id &&
     other.clientId == clientId &&
     other.action == action &&
     other.reason == reason;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (clientId.hashCode) +
    (action.hashCode) +
    (reason == null ? 0 : reason!.hashCode);

  @override
  String toString() => 'CheckExistenceOfAssetResponseDto[id=$id, clientId=$clientId, action=$action, reason=$reason]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'clientId'] = this.clientId;
      json[r'action'] = this.action;
    if (this.reason != null) {
      json[r'reason'] = this.reason;
    } else {
      // json[r'reason'] = null;
    }
    return json;
  }

  /// Returns a new [CheckExistenceOfAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CheckExistenceOfAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CheckExistenceOfAssetResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CheckExistenceOfAssetResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CheckExistenceOfAssetResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        clientId: mapValueOfType<String>(json, r'clientId')!,
        action: CheckExistenceOfAssetResponseDtoActionEnum.fromJson(json[r'action'])!,
        reason: CheckExistenceOfAssetResponseDtoReasonEnum.fromJson(json[r'reason']),
      );
    }
    return null;
  }

  static List<CheckExistenceOfAssetResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckExistenceOfAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckExistenceOfAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CheckExistenceOfAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, CheckExistenceOfAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckExistenceOfAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CheckExistenceOfAssetResponseDto-objects as value to a dart map
  static Map<String, List<CheckExistenceOfAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CheckExistenceOfAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckExistenceOfAssetResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'clientId',
    'action',
  };
}


class CheckExistenceOfAssetResponseDtoActionEnum {
  /// Instantiate a new enum with the provided [value].
  const CheckExistenceOfAssetResponseDtoActionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const accept = CheckExistenceOfAssetResponseDtoActionEnum._(r'Accept');
  static const reject = CheckExistenceOfAssetResponseDtoActionEnum._(r'Reject');

  /// List of all possible values in this [enum][CheckExistenceOfAssetResponseDtoActionEnum].
  static const values = <CheckExistenceOfAssetResponseDtoActionEnum>[
    accept,
    reject,
  ];

  static CheckExistenceOfAssetResponseDtoActionEnum? fromJson(dynamic value) => CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer().decode(value);

  static List<CheckExistenceOfAssetResponseDtoActionEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckExistenceOfAssetResponseDtoActionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckExistenceOfAssetResponseDtoActionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CheckExistenceOfAssetResponseDtoActionEnum] to String,
/// and [decode] dynamic data back to [CheckExistenceOfAssetResponseDtoActionEnum].
class CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer {
  factory CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer() => _instance ??= const CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer._();

  const CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer._();

  String encode(CheckExistenceOfAssetResponseDtoActionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a CheckExistenceOfAssetResponseDtoActionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CheckExistenceOfAssetResponseDtoActionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'Accept': return CheckExistenceOfAssetResponseDtoActionEnum.accept;
        case r'Reject': return CheckExistenceOfAssetResponseDtoActionEnum.reject;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer] instance.
  static CheckExistenceOfAssetResponseDtoActionEnumTypeTransformer? _instance;
}



class CheckExistenceOfAssetResponseDtoReasonEnum {
  /// Instantiate a new enum with the provided [value].
  const CheckExistenceOfAssetResponseDtoReasonEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = CheckExistenceOfAssetResponseDtoReasonEnum._(r'Duplicate');
  static const empty = CheckExistenceOfAssetResponseDtoReasonEnum._(r'');

  /// List of all possible values in this [enum][CheckExistenceOfAssetResponseDtoReasonEnum].
  static const values = <CheckExistenceOfAssetResponseDtoReasonEnum>[
    duplicate,
    empty,
  ];

  static CheckExistenceOfAssetResponseDtoReasonEnum? fromJson(dynamic value) => CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer().decode(value);

  static List<CheckExistenceOfAssetResponseDtoReasonEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckExistenceOfAssetResponseDtoReasonEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckExistenceOfAssetResponseDtoReasonEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CheckExistenceOfAssetResponseDtoReasonEnum] to String,
/// and [decode] dynamic data back to [CheckExistenceOfAssetResponseDtoReasonEnum].
class CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer {
  factory CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer() => _instance ??= const CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer._();

  const CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer._();

  String encode(CheckExistenceOfAssetResponseDtoReasonEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a CheckExistenceOfAssetResponseDtoReasonEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CheckExistenceOfAssetResponseDtoReasonEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'Duplicate': return CheckExistenceOfAssetResponseDtoReasonEnum.duplicate;
        case r'': return CheckExistenceOfAssetResponseDtoReasonEnum.empty;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer] instance.
  static CheckExistenceOfAssetResponseDtoReasonEnumTypeTransformer? _instance;
}


