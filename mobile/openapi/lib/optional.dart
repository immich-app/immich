//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Represents an optional value that can be either absent or present.
///
/// This is used to distinguish between three states in PATCH operations:
/// - Absent: Field is not set (omitted from JSON)
/// - Present with null: Field is explicitly set to null
/// - Present with value: Field has a value
///
/// Example usage:
/// ```dart
/// // Field absent - not sent in request
/// final patch1 = Model();
///
/// // Field explicitly null - sends {"field": null}
/// final patch2 = Model(field: const Optional.present(null));
///
/// // Field has value - sends {"field": "value"}
/// final patch3 = Model(field: const Optional.present('value'));
/// ```
abstract class Optional<T> {
  const Optional();

  /// Creates an Optional with an absent value (not set).
  const factory Optional.absent() = Absent<T>;

  /// Creates an Optional with a present value (can be null).
  const factory Optional.present(T value) = Present<T>;

  /// Returns true if this Optional has a value (even if that value is null).
  bool get isPresent;

  /// Returns true if this Optional does not have a value.
  bool get isEmpty => !isPresent;

  /// Returns the value if present, throws if absent.
  T get value;

  /// Returns the value if present, otherwise returns [defaultValue].
  T orElse(T defaultValue);

  /// Returns the value if present, otherwise returns the result of calling [defaultValue].
  T orElseGet(T Function() defaultValue);

  /// Maps the value if present using [transform], otherwise returns an absent Optional.
  Optional<R> map<R>(R Function(T value) transform);
}

/// Represents an absent Optional value.
class Absent<T> extends Optional<T> {
  const Absent();

  @override
  bool get isPresent => false;

  @override
  T get value => throw StateError('No value present');

  @override
  T orElse(T defaultValue) => defaultValue;

  @override
  T orElseGet(T Function() defaultValue) => defaultValue();

  @override
  Optional<R> map<R>(R Function(T value) transform) => const Absent();

  @override
  bool operator ==(Object other) => other is Absent<T>;

  @override
  int get hashCode => 0;

  @override
  String toString() => 'Optional.absent()';
}

/// Represents a present Optional value.
class Present<T> extends Optional<T> {
  const Present(this._value);

  final T _value;

  @override
  bool get isPresent => true;

  @override
  T get value => _value;

  @override
  T orElse(T defaultValue) => _value;

  @override
  T orElseGet(T Function() defaultValue) => _value;

  @override
  Optional<R> map<R>(R Function(T value) transform) => Optional.present(transform(_value));

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Present<T> && _value == other._value);

  @override
  int get hashCode => _value.hashCode;

  @override
  String toString() => 'Optional.present($_value)';
}
