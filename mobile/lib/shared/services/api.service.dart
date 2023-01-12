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

  /// Takes a server URL and attempts to resolve the API endpoint.
  ///
  /// Input: [schema://]host[:port][/path]
  ///  schema - optional (default: https)
  ///  host   - required
  ///  port   - optional (default: based on schema)
  ///  path   - optional (default: /.well-known/immich)
  resolveEndpoint(String serverUrl) async {
    // Add schema if none is set
    final urlWithSchema = serverUrl.startsWith(RegExp(r"https?://"))
        ? serverUrl
        : "https://$serverUrl";

    final url = Uri.parse(urlWithSchema);
    final origin = url.origin;

    // Trim trailing slash(es) from path
    final path = url.path.replaceFirst(RegExp(r"/+$"), "");

    if (path.isEmpty) {
      // No path provided, lets check for /.well-known/immich
      final wellKnownEndpoint = await getWellKnownEndpoint(origin);
      if (wellKnownEndpoint) return wellKnownEndpoint;
    }

    // Otherwise, assume the URL provided is the api endpoint
    return "$origin$path";
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
      debugPrint("Could not locate /.well-known/immich at $baseUrl");
    }

    return null;
  }

  setAccessToken(String accessToken) {
    _apiClient.addDefaultHeader('Authorization', 'Bearer $accessToken');
  }
}
