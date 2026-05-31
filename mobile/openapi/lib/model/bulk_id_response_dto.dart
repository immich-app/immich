// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class BulkIdResponseDto {
  const BulkIdResponseDto({this.error, this.errorMessage, required this.id, required this.success});

  final BulkIdErrorReason? error;

  final String? errorMessage;

  /// ID
  final String id;

  /// Whether operation succeeded
  final bool success;

  static const _undefined = Object();

  static BulkIdResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<BulkIdResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      error: BulkIdErrorReason.fromJson(json[r'error']),
      errorMessage: (json[r'errorMessage'] as String?),
      id: json[r'id'] as String,
      success: json[r'success'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (error != null) {
      json[r'error'] = error!.toJson();
    }
    if (errorMessage != null) {
      json[r'errorMessage'] = errorMessage!;
    }
    json[r'id'] = id;
    json[r'success'] = success;
    return json;
  }

  BulkIdResponseDto copyWith({
    Object? error = _undefined,
    Object? errorMessage = _undefined,
    String? id,
    bool? success,
  }) {
    return .new(
      error: identical(error, _undefined) ? this.error : error as BulkIdErrorReason?,
      errorMessage: identical(errorMessage, _undefined) ? this.errorMessage : errorMessage as String?,
      id: id ?? this.id,
      success: success ?? this.success,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is BulkIdResponseDto &&
            error == other.error &&
            errorMessage == other.errorMessage &&
            id == other.id &&
            success == other.success);
  }

  @override
  int get hashCode {
    return Object.hashAll([error, errorMessage, id, success]);
  }

  @override
  String toString() => 'BulkIdResponseDto(error=$error, errorMessage=$errorMessage, id=$id, success=$success)';
}
