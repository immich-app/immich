import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:openapi/api.dart';
import 'package:http/http.dart';

class ApiService {
  late ApiClient _apiClient;

  late UserApi userApi;
  late AuthenticationApi authenticationApi;
  late OAuthApi oAuthApi;
  late AlbumApi albumApi;
  late AssetApi assetApi;
  late ServerInfoApi serverInfoApi;
  late DeviceInfoApi deviceInfoApi;

  setEndpoint(String endpoint) {
    _apiClient = ApiClient(basePath: endpoint);
    userApi = UserApi(_apiClient);
    authenticationApi = AuthenticationApi(_apiClient);
    oAuthApi = OAuthApi(_apiClient);
    albumApi = AlbumApi(_apiClient);
    assetApi = AssetApi(_apiClient);
    serverInfoApi = ServerInfoApi(_apiClient);
    deviceInfoApi = DeviceInfoApi(_apiClient);
  }

  resolveEndpoint(String serverUrl) async {
    // Sanitize URL to only include origin+path
    final url = Uri.parse(serverUrl);
    final baseUrl = "${url.origin}${url.path}";

    // Remove trailing slash, if exists
    final endpoint = baseUrl[baseUrl.length - 1] == "/"
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;

    // Check for .well-known definition, otherwise assume endpoint is full API address
    final apiEndpoint = await getWellKnownEndpoint(endpoint) ?? endpoint;
    return apiEndpoint;
  }

  getWellKnownEndpoint(String baseUrl) async {
    final Client client = Client();

    try {
      final res = await client.get(
        Uri.parse("$baseUrl/.well-known/immich"),
        headers: {"Accept": "application/json"},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final endpoint = data['api']['endpoint'] as String;

        if (endpoint.startsWith('/')) {
          // Full URL is relative to base
          return "$baseUrl$endpoint";
        }
        return endpoint;
      }
    } catch (e) {
      debugPrint("Could not locate .well-known at $baseUrl: $e");
    }

    return null;
  }

  setAccessToken(String accessToken) {
    _apiClient.addDefaultHeader('Authorization', 'Bearer $accessToken');
  }
}
