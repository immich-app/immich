import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';
import 'package:immich_mobile/shared/models/server_version.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

final serverInfoServiceProvider =
    Provider((ref) => ServerInfoService(ref.watch(networkServiceProvider)));

class ServerInfoService {
  final NetworkService _networkService;
  ServerInfoService(this._networkService);

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
