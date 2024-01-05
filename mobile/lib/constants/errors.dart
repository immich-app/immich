/// Base class which is used to check if an Exception is a custom exception
sealed class ImmichErrors {
  const ImmichErrors();
}

class NoResponseDtoError extends ImmichErrors implements Exception {
  @override
  String toString() => "Response Dto is null";
}
