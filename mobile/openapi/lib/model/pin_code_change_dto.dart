// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PinCodeChangeDto {
  const PinCodeChangeDto({
    required this.newPinCode,
    this.password = const Optional.absent(),
    this.pinCode = const Optional.absent(),
  });

  /// New PIN code (4-6 digits)
  final String newPinCode;

  /// User password (required if PIN code is not provided)
  final Optional<String> password;

  /// New PIN code (4-6 digits)
  final Optional<String> pinCode;

  static PinCodeChangeDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PinCodeChangeDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      newPinCode: json[r'newPinCode'] as String,
      password: json.containsKey(r'password') ? Optional.present(json[r'password'] as String) : const Optional.absent(),
      pinCode: json.containsKey(r'pinCode') ? Optional.present(json[r'pinCode'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'newPinCode'] = newPinCode;
    if (password case Present(:final value)) {
      json[r'password'] = value;
    }
    if (pinCode case Present(:final value)) {
      json[r'pinCode'] = value;
    }
    return json;
  }

  PinCodeChangeDto copyWith({String? newPinCode, Optional<String>? password, Optional<String>? pinCode}) {
    return .new(
      newPinCode: newPinCode ?? this.newPinCode,
      password: password ?? this.password,
      pinCode: pinCode ?? this.pinCode,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PinCodeChangeDto &&
            newPinCode == other.newPinCode &&
            password == other.password &&
            pinCode == other.pinCode);
  }

  @override
  int get hashCode {
    return Object.hashAll([newPinCode, password, pinCode]);
  }

  @override
  String toString() => 'PinCodeChangeDto(newPinCode=$newPinCode, password=$password, pinCode=$pinCode)';
}
