// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetBulkUploadCheckResult {
  const AssetBulkUploadCheckResult({required this.action, this.assetId, required this.id, this.isTrashed, this.reason});

  final AssetUploadAction action;

  /// Existing asset ID if duplicate
  final String? assetId;

  /// Asset ID
  final String id;

  /// Whether existing asset is trashed
  final bool? isTrashed;

  final AssetRejectReason? reason;

  static const _undefined = Object();

  static AssetBulkUploadCheckResult? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetBulkUploadCheckResult>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      action: (AssetUploadAction.fromJson(json[r'action']))!,
      assetId: (json[r'assetId'] as String?),
      id: json[r'id'] as String,
      isTrashed: (json[r'isTrashed'] as bool?),
      reason: AssetRejectReason.fromJson(json[r'reason']),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'action'] = action.toJson();
    if (assetId != null) {
      json[r'assetId'] = assetId!;
    }
    json[r'id'] = id;
    if (isTrashed != null) {
      json[r'isTrashed'] = isTrashed!;
    }
    if (reason != null) {
      json[r'reason'] = reason!.toJson();
    }
    return json;
  }

  AssetBulkUploadCheckResult copyWith({
    AssetUploadAction? action,
    Object? assetId = _undefined,
    String? id,
    Object? isTrashed = _undefined,
    Object? reason = _undefined,
  }) {
    return .new(
      action: action ?? this.action,
      assetId: identical(assetId, _undefined) ? this.assetId : assetId as String?,
      id: id ?? this.id,
      isTrashed: identical(isTrashed, _undefined) ? this.isTrashed : isTrashed as bool?,
      reason: identical(reason, _undefined) ? this.reason : reason as AssetRejectReason?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetBulkUploadCheckResult &&
            action == other.action &&
            assetId == other.assetId &&
            id == other.id &&
            isTrashed == other.isTrashed &&
            reason == other.reason);
  }

  @override
  int get hashCode {
    return Object.hashAll([action, assetId, id, isTrashed, reason]);
  }

  @override
  String toString() =>
      'AssetBulkUploadCheckResult(action=$action, assetId=$assetId, id=$id, isTrashed=$isTrashed, reason=$reason)';
}
