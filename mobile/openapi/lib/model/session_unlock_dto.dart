// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SessionUnlockDto {
  const SessionUnlockDto({this.password = const Optional.absent(), this.pinCode = const Optional.absent()});

  /// User password (required if PIN code is not provided)
  final Optional<String> password;

  /// New PIN code (4-6 digits)
  final Optional<String> pinCode;

  static SessionUnlockDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SessionUnlockDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      password: json.containsKey(r'password') ? Optional.present(json[r'password'] as String) : const Optional.absent(),
      pinCode: json.containsKey(r'pinCode') ? Optional.present(json[r'pinCode'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (password case Present(:final value)) {
      json[r'password'] = value;
    }
    if (pinCode case Present(:final value)) {
      json[r'pinCode'] = value;
    }
    return json;
  }

  SessionUnlockDto copyWith({Optional<String>? password, Optional<String>? pinCode}) {
    return .new(password: password ?? this.password, pinCode: pinCode ?? this.pinCode);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SessionUnlockDto && password == other.password && pinCode == other.pinCode);
  }

  @override
  int get hashCode {
    return Object.hashAll([password, pinCode]);
  }

  @override
  String toString() => 'SessionUnlockDto(password=$password, pinCode=$pinCode)';
}
