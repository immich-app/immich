// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PinCodeSetupDto {
  const PinCodeSetupDto({required this.pinCode});

  /// PIN code (4-6 digits)
  final String pinCode;

  static PinCodeSetupDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PinCodeSetupDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(pinCode: json[r'pinCode'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'pinCode'] = pinCode;
    return json;
  }

  PinCodeSetupDto copyWith({String? pinCode}) {
    return .new(pinCode: pinCode ?? this.pinCode);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is PinCodeSetupDto && pinCode == other.pinCode);
  }

  @override
  int get hashCode {
    return Object.hashAll([pinCode]);
  }

  @override
  String toString() => 'PinCodeSetupDto(pinCode=$pinCode)';
}
