// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class JobSettingsDto {
  const JobSettingsDto({required this.concurrency});

  /// Concurrency
  final int concurrency;

  static JobSettingsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<JobSettingsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(concurrency: json[r'concurrency'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'concurrency'] = concurrency;
    return json;
  }

  JobSettingsDto copyWith({int? concurrency}) {
    return .new(concurrency: concurrency ?? this.concurrency);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is JobSettingsDto && concurrency == other.concurrency);
  }

  @override
  int get hashCode {
    return Object.hashAll([concurrency]);
  }

  @override
  String toString() => 'JobSettingsDto(concurrency=$concurrency)';
}
