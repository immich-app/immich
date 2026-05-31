// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetEditActionItemDto {
  const AssetEditActionItemDto({required this.action, required this.parameters});

  final AssetEditAction action;

  /// List of edit actions to apply (crop, rotate, or mirror)
  final Map<String, dynamic>? parameters;

  static const _undefined = Object();

  static AssetEditActionItemDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetEditActionItemDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      action: (AssetEditAction.fromJson(json[r'action']))!,
      parameters: (json[r'parameters'] as Map?)?.cast<String, dynamic>(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'action'] = action.toJson();
    if (parameters != null) {
      json[r'parameters'] = parameters;
    }
    return json;
  }

  AssetEditActionItemDto copyWith({AssetEditAction? action, Object? parameters = _undefined}) {
    return .new(
      action: action ?? this.action,
      parameters: identical(parameters, _undefined) ? this.parameters : parameters as Map<String, dynamic>?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetEditActionItemDto && action == other.action && parameters == other.parameters);
  }

  @override
  int get hashCode {
    return Object.hashAll([action, parameters]);
  }

  @override
  String toString() => 'AssetEditActionItemDto(action=$action, parameters=$parameters)';
}
