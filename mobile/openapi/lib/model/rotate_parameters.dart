// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class RotateParameters {
  const RotateParameters({required this.angle});

  /// Rotation angle in degrees
  final double angle;

  static RotateParameters? fromJson(dynamic value) {
    ApiCompat.upgrade<RotateParameters>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(angle: (json[r'angle'] as num).toDouble());
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'angle'] = angle;
    return json;
  }

  RotateParameters copyWith({double? angle}) {
    return .new(angle: angle ?? this.angle);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is RotateParameters && angle == other.angle);
  }

  @override
  int get hashCode {
    return Object.hashAll([angle]);
  }

  @override
  String toString() => 'RotateParameters(angle=$angle)';
}
