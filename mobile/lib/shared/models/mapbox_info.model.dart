import 'dart:convert';

class MapboxInfo {
  final bool isEnable;
  final String mapboxSecret;
  MapboxInfo({
    required this.isEnable,
    required this.mapboxSecret,
  });

  MapboxInfo copyWith({
    bool? isEnable,
    String? mapboxSecret,
  }) {
    return MapboxInfo(
      isEnable: isEnable ?? this.isEnable,
      mapboxSecret: mapboxSecret ?? this.mapboxSecret,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'isEnable': isEnable,
      'mapboxSecret': mapboxSecret,
    };
  }

  factory MapboxInfo.fromMap(Map<String, dynamic> map) {
    return MapboxInfo(
      isEnable: map['isEnable'] ?? false,
      mapboxSecret: map['mapboxSecret'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory MapboxInfo.fromJson(String source) =>
      MapboxInfo.fromMap(json.decode(source));

  @override
  String toString() =>
      'MapboxInfo(isEnable: $isEnable, mapboxSecret: $mapboxSecret)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is MapboxInfo &&
        other.isEnable == isEnable &&
        other.mapboxSecret == mapboxSecret;
  }

  @override
  int get hashCode => isEnable.hashCode ^ mapboxSecret.hashCode;
}
