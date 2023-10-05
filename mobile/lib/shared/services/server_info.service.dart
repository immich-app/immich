import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

final serverInfoServiceProvider = Provider(
  (ref) => ServerInfoService(
    ref.watch(apiServiceProvider),
  ),
);

class ServerInfoService {
  final ApiService _apiService;

  ServerInfoService(this._apiService);

  Future<ServerInfoResponseDto?> getServerInfo() async {
    try {
      return await _apiService.serverInfoApi.getServerInfo();
    } catch (e) {
      debugPrint("Error [getServerInfo] ${e.toString()}");
      return null;
    }
  }

  Future<ServerVersionResponseDto?> getServerVersion() async {
    try {
      return await _apiService.serverInfoApi.getServerVersion();
    } catch (e) {
      debugPrint("Error [getServerVersion] ${e.toString()}");
      return null;
    }
  }

  Future<ServerFeaturesDto?> getServerFeatures() async {
    try {
      return await _apiService.serverInfoApi.getServerFeatures();
    } catch (e) {
      debugPrint("Error [getServerFeatures] ${e.toString()}");
      return null;
    }
  }

  Future<ServerConfigDto?> getServerConfig() async {
    try {
      return await _apiService.serverInfoApi.getServerConfig();
    } catch (e) {
      debugPrint("Error [getServerConfig] ${e.toString()}");
      return null;
    }
  }
}
