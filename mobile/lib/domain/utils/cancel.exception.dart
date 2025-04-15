class CancelException implements Exception {
  final String message;

  const CancelException([this.message = "Operation was cancelled."]);

  @override
  String toString() => "CancelException: $message";
}
