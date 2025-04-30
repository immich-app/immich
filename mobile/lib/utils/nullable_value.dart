/// A utility class to represent a value that can be either present or absent.
/// This is useful for cases where you want to distinguish between a value
/// being explicitly set to null and a value not being set at all.
class NullableValue<T> {
  final bool _present;
  final T? _value;

  const NullableValue._(this._value, {bool present = false})
      : _present = present;

  /// Creates an instance without value
  const NullableValue.absent() : this._(null, present: false);

  /// Forces the value to be null
  const NullableValue.empty() : this._(null, present: true);

  /// Uses the value if it's not null, otherwise null or default value
  const NullableValue.value(T? value) : this._(value, present: value != null);

  /// Always uses the value even if it's null
  const NullableValue.valueOrEmpty(T? value) : this._(value, present: true);

  T? get() => _present ? _value : null;

  T? getOrDefault(T? defaultValue) => _present ? _value : defaultValue;
}
