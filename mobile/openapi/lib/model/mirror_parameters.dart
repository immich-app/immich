// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MirrorParameters {
  const MirrorParameters({required this.axis});

  final MirrorAxis axis;

  static MirrorParameters? fromJson(dynamic value) {
    ApiCompat.upgrade<MirrorParameters>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(axis: (MirrorAxis.fromJson(json[r'axis']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'axis'] = axis.toJson();
    return json;
  }

  MirrorParameters copyWith({MirrorAxis? axis}) {
    return .new(axis: axis ?? this.axis);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is MirrorParameters && axis == other.axis);
  }

  @override
  int get hashCode {
    return Object.hashAll([axis]);
  }

  @override
  String toString() => 'MirrorParameters(axis=$axis)';
}
