// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PartnerUpdateDto {
  const PartnerUpdateDto({required this.inTimeline});

  /// Show partner assets in timeline
  final bool inTimeline;

  static PartnerUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PartnerUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(inTimeline: json[r'inTimeline'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'inTimeline'] = inTimeline;
    return json;
  }

  PartnerUpdateDto copyWith({bool? inTimeline}) {
    return .new(inTimeline: inTimeline ?? this.inTimeline);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is PartnerUpdateDto && inTimeline == other.inTimeline);
  }

  @override
  int get hashCode {
    return Object.hashAll([inTimeline]);
  }

  @override
  String toString() => 'PartnerUpdateDto(inTimeline=$inTimeline)';
}
