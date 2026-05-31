// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class LicenseKeyDto {
  const LicenseKeyDto({required this.activationKey, required this.licenseKey});

  /// Activation key
  final String activationKey;

  /// License key (format: /^IM(SV|CL)(-[\dA-Za-z]{4}){8}$/)
  final String licenseKey;

  static LicenseKeyDto? fromJson(dynamic value) {
    ApiCompat.upgrade<LicenseKeyDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(activationKey: json[r'activationKey'] as String, licenseKey: json[r'licenseKey'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'activationKey'] = activationKey;
    json[r'licenseKey'] = licenseKey;
    return json;
  }

  LicenseKeyDto copyWith({String? activationKey, String? licenseKey}) {
    return .new(activationKey: activationKey ?? this.activationKey, licenseKey: licenseKey ?? this.licenseKey);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is LicenseKeyDto && activationKey == other.activationKey && licenseKey == other.licenseKey);
  }

  @override
  int get hashCode {
    return Object.hashAll([activationKey, licenseKey]);
  }

  @override
  String toString() => 'LicenseKeyDto(activationKey=$activationKey, licenseKey=$licenseKey)';
}
