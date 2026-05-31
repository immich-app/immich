// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ValidateLibraryImportPathResponseDto {
  const ValidateLibraryImportPathResponseDto({required this.importPath, required this.isValid, this.message});

  /// Import path
  final String importPath;

  /// Is valid
  final bool isValid;

  /// Validation message
  final String? message;

  static const _undefined = Object();

  static ValidateLibraryImportPathResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ValidateLibraryImportPathResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      importPath: json[r'importPath'] as String,
      isValid: json[r'isValid'] as bool,
      message: (json[r'message'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'importPath'] = importPath;
    json[r'isValid'] = isValid;
    if (message != null) {
      json[r'message'] = message!;
    }
    return json;
  }

  ValidateLibraryImportPathResponseDto copyWith({String? importPath, bool? isValid, Object? message = _undefined}) {
    return .new(
      importPath: importPath ?? this.importPath,
      isValid: isValid ?? this.isValid,
      message: identical(message, _undefined) ? this.message : message as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ValidateLibraryImportPathResponseDto &&
            importPath == other.importPath &&
            isValid == other.isValid &&
            message == other.message);
  }

  @override
  int get hashCode {
    return Object.hashAll([importPath, isValid, message]);
  }

  @override
  String toString() =>
      'ValidateLibraryImportPathResponseDto(importPath=$importPath, isValid=$isValid, message=$message)';
}
