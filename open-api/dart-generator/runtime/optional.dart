// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// Self-contained three-state wrapper for JSON request bodies. Intentionally has
// no dependency on the host app's `Option` — this type belongs to the client
// and is only used at the request-DTO boundary.
part of openapi.api;

/// A three-state value for PATCH/POST/PUT request bodies, distinguishing:
///   * absent      — field omitted from the JSON (`Optional.absent()`)
///   * present null — field explicitly `null` (`Optional.present(null)`)
///   * present value — field has a value (`Optional.present(x)`)
///
/// Sealed, so a `switch` over [Absent]/[Present] is exhaustiveness-checked.
sealed class Optional<T> {
  const Optional();

  /// The field is omitted (not sent).
  const factory Optional.absent() = Absent<T>;

  /// The field is present with [value] (which may itself be null).
  const factory Optional.present(T value) = Present<T>;

  /// True when a value is present (even if that value is null).
  bool get isPresent;

  /// The value if present, otherwise throws [StateError].
  T get value;

  /// The value if present, otherwise [defaultValue].
  T orElse(T defaultValue);

  /// Maps a present value with [transform]; an absent stays absent.
  Optional<R> map<R>(R Function(T value) transform);
}

/// The absent state of an [Optional].
final class Absent<T> extends Optional<T> {
  const Absent();

  @override
  bool get isPresent => false;

  @override
  T get value => throw StateError('Optional is absent');

  @override
  T orElse(T defaultValue) => defaultValue;

  @override
  Optional<R> map<R>(R Function(T value) transform) => Absent<R>();

  @override
  bool operator ==(Object other) => other is Absent<T>;

  @override
  int get hashCode => (Absent<T>).hashCode;

  @override
  String toString() => 'Optional.absent()';
}

/// The present state of an [Optional], wrapping a (possibly null) [value].
final class Present<T> extends Optional<T> {
  const Present(this.value);

  @override
  final T value;

  @override
  bool get isPresent => true;

  @override
  T orElse(T defaultValue) => value;

  @override
  Optional<R> map<R>(R Function(T value) transform) => Present<R>(transform(value));

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Present<T> && other.value == value);

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Optional.present($value)';
}

/// Ergonomic construction at request-DTO call sites: maps a nullable value to
/// an [Optional], treating `null` as absent (matching the wire behaviour of
/// omitting null fields). Use [Optional.present] directly to send an explicit
/// null.
extension ToOptional<T extends Object> on T? {
  Optional<T> toOptional() => this == null ? Absent<T>() : Present<T>(this as T);
}
