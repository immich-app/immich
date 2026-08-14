extension Let<T extends Object> on T {
  R let<R>(R Function(T) transform) => transform(this);
}
