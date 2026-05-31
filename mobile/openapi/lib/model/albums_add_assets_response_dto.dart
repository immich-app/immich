// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumsAddAssetsResponseDto {
  const AlbumsAddAssetsResponseDto({this.error, required this.success});

  final BulkIdErrorReason? error;

  /// Operation success
  final bool success;

  static const _undefined = Object();

  static AlbumsAddAssetsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumsAddAssetsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(error: BulkIdErrorReason.fromJson(json[r'error']), success: json[r'success'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (error != null) {
      json[r'error'] = error!.toJson();
    }
    json[r'success'] = success;
    return json;
  }

  AlbumsAddAssetsResponseDto copyWith({Object? error = _undefined, bool? success}) {
    return .new(
      error: identical(error, _undefined) ? this.error : error as BulkIdErrorReason?,
      success: success ?? this.success,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AlbumsAddAssetsResponseDto && error == other.error && success == other.success);
  }

  @override
  int get hashCode {
    return Object.hashAll([error, success]);
  }

  @override
  String toString() => 'AlbumsAddAssetsResponseDto(error=$error, success=$success)';
}
