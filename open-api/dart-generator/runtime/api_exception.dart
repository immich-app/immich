// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Thrown when an API call fails: a non-2xx HTTP status, a transport error, or
/// a (de)serialization failure.
///
/// [code] is the HTTP status code (or a transport-level sentinel such as
/// [HttpStatus.badRequest]) and [message] is a human-readable description.
class ApiException implements Exception {
  ApiException(this.code, [this.message])
      : innerException = null,
        stackTrace = null;

  ApiException.withInner(this.code, this.message, this.innerException, this.stackTrace);

  /// HTTP status code, or a transport sentinel for non-HTTP failures.
  final int code;

  /// Human-readable failure description; may be the decoded response body.
  final String? message;

  /// The originating exception for transport / deserialization failures.
  final Object? innerException;

  /// The stack trace captured when [innerException] was caught.
  final StackTrace? stackTrace;

  @override
  String toString() {
    if (message == null) {
      return 'ApiException';
    }
    if (innerException == null) {
      return 'ApiException $code: $message';
    }
    return 'ApiException $code: $message (Inner exception: $innerException)\n\n$stackTrace';
  }
}
