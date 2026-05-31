// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetEditV1 {
  const SyncAssetEditV1({
    required this.action,
    required this.assetId,
    required this.id,
    required this.parameters,
    required this.sequence,
  });

  final AssetEditAction action;

  /// Asset ID
  final String assetId;

  /// Edit ID
  final String id;

  /// Edit parameters
  final Map<String, dynamic> parameters;

  /// Edit sequence
  final int sequence;

  static SyncAssetEditV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetEditV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      action: (AssetEditAction.fromJson(json[r'action']))!,
      assetId: json[r'assetId'] as String,
      id: json[r'id'] as String,
      parameters: ((json[r'parameters'] as Map?)?.cast<String, dynamic>())!,
      sequence: json[r'sequence'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'action'] = action.toJson();
    json[r'assetId'] = assetId;
    json[r'id'] = id;
    json[r'parameters'] = parameters;
    json[r'sequence'] = sequence;
    return json;
  }

  SyncAssetEditV1 copyWith({
    AssetEditAction? action,
    String? assetId,
    String? id,
    Map<String, dynamic>? parameters,
    int? sequence,
  }) {
    return .new(
      action: action ?? this.action,
      assetId: assetId ?? this.assetId,
      id: id ?? this.id,
      parameters: parameters ?? this.parameters,
      sequence: sequence ?? this.sequence,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAssetEditV1 &&
            action == other.action &&
            assetId == other.assetId &&
            id == other.id &&
            const DeepCollectionEquality().equals(parameters, other.parameters) &&
            sequence == other.sequence);
  }

  @override
  int get hashCode {
    return Object.hashAll([action, assetId, id, const DeepCollectionEquality().hash(parameters), sequence]);
  }

  @override
  String toString() =>
      'SyncAssetEditV1(action=$action, assetId=$assetId, id=$id, parameters=$parameters, sequence=$sequence)';
}
