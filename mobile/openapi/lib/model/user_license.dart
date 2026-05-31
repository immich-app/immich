// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserLicense {
  const UserLicense({required this.activatedAt, required this.activationKey, required this.licenseKey});

  /// Activation date
  final DateTime activatedAt;

  /// Activation key
  final String activationKey;

  /// License key (format: /^IM(SV|CL)(-[\dA-Za-z]{4}){8}$/)
  final String licenseKey;

  static UserLicense? fromJson(dynamic value) {
    ApiCompat.upgrade<UserLicense>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      activatedAt: DateTime.parse(json[r'activatedAt'] as String),
      activationKey: json[r'activationKey'] as String,
      licenseKey: json[r'licenseKey'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'activatedAt'] = activatedAt.toUtc().toIso8601String();
    json[r'activationKey'] = activationKey;
    json[r'licenseKey'] = licenseKey;
    return json;
  }

  UserLicense copyWith({DateTime? activatedAt, String? activationKey, String? licenseKey}) {
    return .new(
      activatedAt: activatedAt ?? this.activatedAt,
      activationKey: activationKey ?? this.activationKey,
      licenseKey: licenseKey ?? this.licenseKey,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UserLicense &&
            activatedAt == other.activatedAt &&
            activationKey == other.activationKey &&
            licenseKey == other.licenseKey);
  }

  @override
  int get hashCode {
    return Object.hashAll([activatedAt, activationKey, licenseKey]);
  }

  @override
  String toString() => 'UserLicense(activatedAt=$activatedAt, activationKey=$activationKey, licenseKey=$licenseKey)';
}
