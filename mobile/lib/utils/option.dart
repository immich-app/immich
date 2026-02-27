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

  U fold<U>(U Function(T value) onSome, U Function() onNone) => switch (this) {
    Some(:final value) => onSome(value),
    None() => onNone(),
  };

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

extension ObjectOptionExtension<T> on T? {
  Option<T> toOption() => Option.fromNullable(this);
}
