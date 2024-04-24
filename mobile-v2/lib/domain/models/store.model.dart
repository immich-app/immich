/// Key for each possible value in the `Store`.
/// Defines the data type for each value
enum StoreKey<T> {
  // Server endpoint related stores
  accessToken<String>(0, type: String),
  serverEndpoint<String>(1, type: String),
  ;

  const StoreKey(this.id, {required this.type});
  final int id;
  final Type type;
}

class StoreValue {
  final int id;
  final int? intValue;
  final String? stringValue;

  const StoreValue({required this.id, this.intValue, this.stringValue});

  @override
  bool operator ==(covariant StoreValue other) {
    if (identical(this, other)) return true;

    return other.hashCode == hashCode;
  }

  @override
  int get hashCode => id.hashCode ^ intValue.hashCode ^ stringValue.hashCode;

  T? extract<T>(Type type) {
    switch (type) {
      case const (int):
        return intValue as T?;
      case const (bool):
        return intValue == null ? null : (intValue! == 1) as T;
      case const (DateTime):
        return intValue == null
            ? null
            : DateTime.fromMicrosecondsSinceEpoch(intValue!) as T;
      case const (String):
        return stringValue as T?;
      default:
        throw UnsupportedError("Unknown Store Key type");
    }
  }

  static StoreValue of<T>(StoreKey<T> key, T? value) {
    int? i;
    String? s;

    switch (key.type) {
      case const (int):
        i = value as int?;
        break;
      case const (bool):
        i = value == null ? null : (value == true ? 1 : 0);
        break;
      case const (DateTime):
        i = value == null ? null : (value as DateTime).microsecondsSinceEpoch;
        break;
      case const (String):
        s = value as String?;
        break;
      default:
        throw UnsupportedError("Unknown Store Key type");
    }
    return StoreValue(id: key.id, intValue: i, stringValue: s);
  }
}
