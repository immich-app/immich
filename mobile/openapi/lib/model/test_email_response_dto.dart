// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TestEmailResponseDto {
  const TestEmailResponseDto({required this.messageId});

  /// Email message ID
  final String messageId;

  static TestEmailResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TestEmailResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(messageId: json[r'messageId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'messageId'] = messageId;
    return json;
  }

  TestEmailResponseDto copyWith({String? messageId}) {
    return .new(messageId: messageId ?? this.messageId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TestEmailResponseDto && messageId == other.messageId);
  }

  @override
  int get hashCode {
    return Object.hashAll([messageId]);
  }

  @override
  String toString() => 'TestEmailResponseDto(messageId=$messageId)';
}
