sealed class Option<T> {
  const Option();

  bool get isSome => this is Some<T>;
  bool get isNone => this is None;

  factory Option.some(T value) {
    return Some<T>(value);
  }

  factory Option.none() {
    return const None();
  }

  factory Option.from(T? value) {
    if (value == null) {
      return const None();
    }
    return Some<T>(value);
  }

  T? unwrapOrNull() {
    if (this is Some<T>) {
      return (this as Some<T>).value;
    }
    return null;
  }

  T unwrap() {
    if (this is Some<T>) {
      return (this as Some<T>).value;
    }
    throw StateError('Cannot unwrap None');
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! Option<T>) return false;
    if (this is None && other is None) {
      return true;
    }
    return this is Some<T> &&
        other is Some<T> &&
        this.unwrap() == other.unwrap();
  }

  @override
  int get hashCode {
    if (this is Some<T>) {
      return (this.unwrap()).hashCode;
    }
    return 0;
  }

  @override
  String toString() {
    if (this is Some<T>) {
      return 'Some(${this.unwrap()})';
    }
    return 'None';
  }
}

class Some<T> extends Option<T> {
  final T value;

  const Some(this.value);

  static Some<U>? tryFrom<U>(U? value) {
    if (value == null) {
      return null;
    }
    return Some(value);
  }
}

class None extends Option<Never> {
  const None();
}

// Implemented as an extension rather than adding to the Option class because
// the type argument for None is not known at compile time, and fallback to Never
// As such, when the method is called on Option<Never>, with a default value of T,
// a runtime error
extension OptionExtensions<T> on Option<T> {
  T unwrapOr(T defaultValue) {
    if (this is Some<T>) {
      return (this as Some<T>).value;
    }
    return defaultValue;
  }
}
