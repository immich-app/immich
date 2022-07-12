import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/server_version.model.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:openapi/api.dart';

final serverInfoServiceProvider = Provider(
  (ref) => ServerInfoService(
    ref.watch(networkServiceProvider),
    ref.watch(apiServiceProvider),
  ),
);

class ServerInfoService {
  final NetworkService _networkService;
  final ApiService _apiService;
  ServerInfoService(this._networkService, this._apiService);

  Future<ServerInfoResponseDto?> getServerInfo() async {
    try {
      return await _apiService.serverInfoApi.getServerInfo();
    } catch (e) {
      debugPrint("Error [getServerInfo] ${e.toString()}");
      return null;
    }
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
