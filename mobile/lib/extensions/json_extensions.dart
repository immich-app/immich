extension JsonHelper on Map<String, Object?> {
  /// Returns the nested map under [key] or an empty const map if the key is absent or the value is not a map
  Map<String, Object?> nested(String key) => (this[key] as Map<String, Object?>?) ?? const {};
}
