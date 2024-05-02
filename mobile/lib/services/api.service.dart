import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:logging/logging.dart';
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
  late PersonApi personApi;
  late AuditApi auditApi;
  late SharedLinkApi sharedLinkApi;
  late SystemConfigApi systemConfigApi;
  late ActivityApi activityApi;
  late DownloadApi downloadApi;
  late TrashApi trashApi;

  ApiService() {
    final endpoint = Store.tryGet(StoreKey.serverEndpoint);
    if (endpoint != null && endpoint.isNotEmpty) {
      setEndpoint(endpoint);
    }
  }
  String? _accessToken;
  final _log = Logger("ApiService");

  setEndpoint(String endpoint) {
    _apiClient = ApiClient(basePath: endpoint);
    if (_accessToken != null) {
      setAccessToken(_accessToken!);
    }
    userApi = UserApi(_apiClient);
    authenticationApi = AuthenticationApi(_apiClient);
    oAuthApi = OAuthApi(_apiClient);
    albumApi = AlbumApi(_apiClient);
    assetApi = AssetApi(_apiClient);
    serverInfoApi = ServerInfoApi(_apiClient);
    searchApi = SearchApi(_apiClient);
    partnerApi = PartnerApi(_apiClient);
    personApi = PersonApi(_apiClient);
    auditApi = AuditApi(_apiClient);
    sharedLinkApi = SharedLinkApi(_apiClient);
    systemConfigApi = SystemConfigApi(_apiClient);
    activityApi = ActivityApi(_apiClient);
    downloadApi = DownloadApi(_apiClient);
    trashApi = TrashApi(_apiClient);
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

    if (!await _isEndpointAvailable(serverUrl)) {
      throw ApiException(503, "Server is not reachable");
    }

    // Check for /.well-known/immich
    final wellKnownEndpoint = await _getWellKnownEndpoint(url);
    if (wellKnownEndpoint.isNotEmpty) return wellKnownEndpoint;

    // Otherwise, assume the URL provided is the api endpoint
    return url;
  }

  Future<bool> _isEndpointAvailable(String serverUrl) async {
    final Client client = Client();

    if (!serverUrl.endsWith('/api')) {
      serverUrl += '/api';
    }

    try {
      final response = await client
          .get(Uri.parse("$serverUrl/server-info/ping"))
          .timeout(const Duration(seconds: 5));

      _log.info("Pinging server with response code ${response.statusCode}");
      if (response.statusCode != 200) {
        _log.severe(
          "Server Gateway Error: ${response.body} - Cannot communicate to the server",
        );
        return false;
      }
    } on TimeoutException catch (_) {
      return false;
    } on SocketException catch (_) {
      return false;
    } catch (error, stackTrace) {
      _log.severe(
        "Error while checking server availability",
        error,
        stackTrace,
      );
      return false;
    }
    return true;
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
    _accessToken = accessToken;
    _apiClient.addDefaultHeader('x-immich-user-token', accessToken);
  }

  ApiClient get apiClient => _apiClient;
}
