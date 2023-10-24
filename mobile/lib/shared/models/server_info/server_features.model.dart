import 'package:openapi/api.dart';

class ServerFeatures {
  final bool trash;
  final bool map;

  const ServerFeatures({
    required this.trash,
    required this.map,
  });

  ServerFeatures copyWith({
    bool? trash,
    bool? map,
  }) {
    return ServerFeatures(
      trash: trash ?? this.trash,
      map: map ?? this.map,
    );
  }

  @override
  String toString() {
    return 'ServerFeatures(trash: $trash, map: $map)';
  }

  ServerFeatures.fromDto(ServerFeaturesDto dto)
      : trash = dto.trash,
        map = dto.map;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerFeatures && other.trash == trash && other.map == map;
  }

  @override
  int get hashCode {
    return trash.hashCode ^ map.hashCode;
  }
}
