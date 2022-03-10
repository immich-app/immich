import 'package:dio/dio.dart';
import 'package:immich_mobile/shared/models/mapbox_info.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';

class ServerInfoService {
  final NetworkService _networkService = NetworkService();

  Future<ServerInfo> getServerInfo() async {
    Response response = await _networkService.getRequest(url: 'server-info');

    return ServerInfo.fromJson(response.toString());
  }

  Future<MapboxInfo> getMapboxInfo() async {
    Response response = await _networkService.getRequest(url: 'server-info/mapbox');

    return MapboxInfo.fromJson(response.toString());
  }
}
