// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncPartnerDeleteV1 {
  const SyncPartnerDeleteV1({required this.sharedById, required this.sharedWithId});

  /// Shared by ID
  final String sharedById;

  /// Shared with ID
  final String sharedWithId;

  static SyncPartnerDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncPartnerDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(sharedById: json[r'sharedById'] as String, sharedWithId: json[r'sharedWithId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'sharedById'] = sharedById;
    json[r'sharedWithId'] = sharedWithId;
    return json;
  }

  SyncPartnerDeleteV1 copyWith({String? sharedById, String? sharedWithId}) {
    return .new(sharedById: sharedById ?? this.sharedById, sharedWithId: sharedWithId ?? this.sharedWithId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncPartnerDeleteV1 && sharedById == other.sharedById && sharedWithId == other.sharedWithId);
  }

  @override
  int get hashCode {
    return Object.hashAll([sharedById, sharedWithId]);
  }

  @override
  String toString() => 'SyncPartnerDeleteV1(sharedById=$sharedById, sharedWithId=$sharedWithId)';
}
