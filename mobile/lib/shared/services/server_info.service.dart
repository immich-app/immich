import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/mapbox_info.model.dart';
import 'package:immich_mobile/shared/models/server_version.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';

class ServerInfoService {
  final NetworkService _networkService = NetworkService();

  Future<ServerInfo> getServerInfo() async {
    Response response = await _networkService.getRequest(url: 'server-info');

    return ServerInfo.fromJson(response.toString());
  }

  Future<ServerVersion?> getServerVersion() async {
    try {
      Response response =
          await _networkService.getRequest(url: 'server-info/version');

      return ServerVersion.fromJson(response.toString());
    } catch (e) {
      debugPrint("Error getting server info");
    }

    return null;
  }
}
