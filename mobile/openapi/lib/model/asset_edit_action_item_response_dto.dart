// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetEditActionItemResponseDto {
  const AssetEditActionItemResponseDto({required this.action, required this.id, required this.parameters});

  final AssetEditAction action;

  /// Asset edit ID
  final String id;

  /// List of edit actions to apply (crop, rotate, or mirror)
  final Map<String, dynamic>? parameters;

  static const _undefined = Object();

  static AssetEditActionItemResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetEditActionItemResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      action: (AssetEditAction.fromJson(json[r'action']))!,
      id: json[r'id'] as String,
      parameters: (json[r'parameters'] as Map?)?.cast<String, dynamic>(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'action'] = action.toJson();
    json[r'id'] = id;
    if (parameters != null) {
      json[r'parameters'] = parameters;
    }
    return json;
  }

  AssetEditActionItemResponseDto copyWith({AssetEditAction? action, String? id, Object? parameters = _undefined}) {
    return .new(
      action: action ?? this.action,
      id: id ?? this.id,
      parameters: identical(parameters, _undefined) ? this.parameters : parameters as Map<String, dynamic>?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetEditActionItemResponseDto &&
            action == other.action &&
            id == other.id &&
            parameters == other.parameters);
  }

  @override
  int get hashCode {
    return Object.hashAll([action, id, parameters]);
  }

  @override
  String toString() => 'AssetEditActionItemResponseDto(action=$action, id=$id, parameters=$parameters)';
}
