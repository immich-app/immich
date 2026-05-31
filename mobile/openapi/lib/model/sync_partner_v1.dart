// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncPartnerV1 {
  const SyncPartnerV1({required this.inTimeline, required this.sharedById, required this.sharedWithId});

  /// In timeline
  final bool inTimeline;

  /// Shared by ID
  final String sharedById;

  /// Shared with ID
  final String sharedWithId;

  static SyncPartnerV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncPartnerV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      inTimeline: json[r'inTimeline'] as bool,
      sharedById: json[r'sharedById'] as String,
      sharedWithId: json[r'sharedWithId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'inTimeline'] = inTimeline;
    json[r'sharedById'] = sharedById;
    json[r'sharedWithId'] = sharedWithId;
    return json;
  }

  SyncPartnerV1 copyWith({bool? inTimeline, String? sharedById, String? sharedWithId}) {
    return .new(
      inTimeline: inTimeline ?? this.inTimeline,
      sharedById: sharedById ?? this.sharedById,
      sharedWithId: sharedWithId ?? this.sharedWithId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncPartnerV1 &&
            inTimeline == other.inTimeline &&
            sharedById == other.sharedById &&
            sharedWithId == other.sharedWithId);
  }

  @override
  int get hashCode {
    return Object.hashAll([inTimeline, sharedById, sharedWithId]);
  }

  @override
  String toString() => 'SyncPartnerV1(inTimeline=$inTimeline, sharedById=$sharedById, sharedWithId=$sharedWithId)';
}
