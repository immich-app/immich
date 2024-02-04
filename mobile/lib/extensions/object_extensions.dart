extension OptionalCast on Object {
  T? tryCast<T>() => this is T ? this as T : null;
}

extension NullUtilities on Object? {
  /// Returns true if object is null or is empty
  bool get isNullOrEmpty => (this == null || _isIterableAndEmpty);

  bool get _isIterableAndEmpty =>
      this is Iterable ? (this as Iterable).isEmpty : false;
}
