import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:openapi/api.dart';
import 'package:http/http.dart';

class ApiService {
  late ApiClient _apiClient;

  late UserApi userApi;
  late AuthenticationApi authenticationApi;
  late OAuthApi oAuthApi;
  late AlbumApi albumApi;
  late AssetApi assetApi;
  late SearchApi searchApi;
  late ServerInfoApi serverInfoApi;
  late PartnerApi partnerApi;

  ApiService() {
    final endpoint = Store.tryGet(StoreKey.serverEndpoint);
    if (endpoint != null && endpoint.isNotEmpty) {
      setEndpoint(endpoint);
    }
  }
  String? _authToken;

  setEndpoint(String endpoint) {
    _apiClient = ApiClient(basePath: endpoint);
    if (_authToken != null) {
      setAccessToken(_authToken!);
    }
    userApi = UserApi(_apiClient);
    authenticationApi = AuthenticationApi(_apiClient);
    oAuthApi = OAuthApi(_apiClient);
    albumApi = AlbumApi(_apiClient);
    assetApi = AssetApi(_apiClient);
    serverInfoApi = ServerInfoApi(_apiClient);
    searchApi = SearchApi(_apiClient);
    partnerApi = PartnerApi(_apiClient);
  }

  Future<String> resolveAndSetEndpoint(String serverUrl) async {
    final endpoint = await _resolveEndpoint(serverUrl);
    setEndpoint(endpoint);

    // Save in hivebox for next startup
    Store.put(StoreKey.serverEndpoint, endpoint);
    return endpoint;
  }

  /// Takes a server URL and attempts to resolve the API endpoint.
  ///
  /// Input: [schema://]host[:port][/path]
  ///  schema - optional (default: https)
  ///  host   - required
  ///  port   - optional (default: based on schema)
  ///  path   - optional
  Future<String> _resolveEndpoint(String serverUrl) async {
    final url = sanitizeUrl(serverUrl);

    // Check for /.well-known/immich
    final wellKnownEndpoint = await _getWellKnownEndpoint(url);
    if (wellKnownEndpoint.isNotEmpty) return wellKnownEndpoint;

    // Otherwise, assume the URL provided is the api endpoint
    return url;
  }

  Future<String> _getWellKnownEndpoint(String baseUrl) async {
    final Client client = Client();

    try {
      final res = await client.get(
        Uri.parse("$baseUrl/.well-known/immich"),
        headers: {"Accept": "application/json"},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final endpoint = data['api']['endpoint'].toString();

        if (endpoint.startsWith('/')) {
          // Full URL is relative to base
          return "$baseUrl$endpoint";
        }
        return endpoint;
      }
    } catch (e) {
      debugPrint("Could not locate /.well-known/immich at $baseUrl");
    }

    return "";
  }

  setAccessToken(String accessToken) {
    _authToken = accessToken;
    _apiClient.addDefaultHeader('Authorization', 'Bearer $accessToken');
  }

  ApiClient get apiClient => _apiClient;
}
