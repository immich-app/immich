import 'package:drift/drift.dart';
import 'package:openapi/api.dart' show Optional;

sealed class Option<T> {
  const Option();

  const factory Option.some(T value) = Some<T>;

  const factory Option.none() = None<T>;

  factory Option.fromNullable(T? value) => value != null ? Some(value) : None<T>();

  @pragma('vm:prefer-inline')
  bool get isSome => this is Some<T>;

  @pragma('vm:prefer-inline')
  bool get isNone => this is None<T>;

  @pragma('vm:prefer-inline')
  T? get unwrapOrNull => switch (this) {
    Some(:final value) => value,
    None() => null,
  };

  Option<U> map<U>(U Function(T value) f) => switch (this) {
    Some(:final value) => Some(f(value)),
    None() => None<U>(),
  };

  U fold<U>(U Function(T value) onSome, U Function() onNone) => switch (this) {
    Some(:final value) => onSome(value),
    None() => onNone(),
  };

  Option<U> flatMap<U>(Option<U> Function(T value) f) => switch (this) {
    Some(:final value) => f(value),
    None() => const Option.none(),
  };

  void ifPresent(void Function(T value) f) {
    if (this case Some(:final value)) {
      f(value);
    }
  }

  @override
  String toString() => switch (this) {
    Some(:final value) => 'Some($value)',
    None() => 'None',
  };
}

final class Some<T> extends Option<T> {
  final T value;

  const Some(this.value);

  @override
  bool operator ==(Object other) => other is Some<T> && other.value == value;

  @override
  int get hashCode => value.hashCode;
}

final class None<T> extends Option<T> {
  const None();

  @override
  bool operator ==(Object other) => other is None<T>;

  @override
  int get hashCode => 0;
}

extension NullableOptionExtension<T> on Option<T>? {
  T? patch(T? current) => this == null ? current : this!.unwrapOrNull;
}

extension OptionToOptional<T> on Option<T> {
  Optional<T> toOptional() => switch (this) {
    None() => const Optional.absent(),
    Some(:final value) => Optional.present(value),
  };
}

extension OptionToDriftValue<T> on Option<T> {
  Value<T> toDriftValue() => switch (this) {
    Some(:final value) => Value(value),
    None() => const Value.absent(),
  };
}
