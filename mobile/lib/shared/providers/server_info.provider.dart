import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/shared/models/mapbox_info.model.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';

class ServerInfoState {
  final MapboxInfo mapboxInfo;
  ServerInfoState({
    required this.mapboxInfo,
  });

  ServerInfoState copyWith({
    MapboxInfo? mapboxInfo,
  }) {
    return ServerInfoState(
      mapboxInfo: mapboxInfo ?? this.mapboxInfo,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'mapboxInfo': mapboxInfo.toMap(),
    };
  }

  factory ServerInfoState.fromMap(Map<String, dynamic> map) {
    return ServerInfoState(
      mapboxInfo: MapboxInfo.fromMap(map['mapboxInfo']),
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerInfoState.fromJson(String source) => ServerInfoState.fromMap(json.decode(source));

  @override
  String toString() => 'ServerInfoState(mapboxInfo: $mapboxInfo)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfoState && other.mapboxInfo == mapboxInfo;
  }

  @override
  int get hashCode => mapboxInfo.hashCode;
}

class ServerInfoNotifier extends StateNotifier<ServerInfoState> {
  ServerInfoNotifier()
      : super(
          ServerInfoState(
            mapboxInfo: MapboxInfo(isEnable: false, mapboxSecret: ""),
          ),
        );

  final ServerInfoService _serverInfoService = ServerInfoService();

  getMapboxInfo() async {
    MapboxInfo mapboxInfoRes = await _serverInfoService.getMapboxInfo();
    print(mapboxInfoRes);
    state = state.copyWith(mapboxInfo: mapboxInfoRes);
  }
}

final serverInfoProvider = StateNotifierProvider<ServerInfoNotifier, ServerInfoState>((ref) {
  return ServerInfoNotifier();
});
