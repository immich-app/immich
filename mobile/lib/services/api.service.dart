import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:http/http.dart';

class ApiService implements Authentication {
  late ApiClient _apiClient;

  late UsersApi usersApi;
  late AuthenticationApi authenticationApi;
  late OAuthApi oAuthApi;
  late AlbumsApi albumsApi;
  late AssetsApi assetsApi;
  late SearchApi searchApi;
  late ServerApi serverInfoApi;
  late MapApi mapApi;
  late PartnersApi partnersApi;
  late PeopleApi peopleApi;
  late AuditApi auditApi;
  late SharedLinksApi sharedLinksApi;
  late SyncApi syncApi;
  late SystemConfigApi systemConfigApi;
  late ActivitiesApi activitiesApi;
  late DownloadApi downloadApi;
  late TrashApi trashApi;
  late StacksApi stacksApi;

  ApiService() {
    final endpoint = Store.tryGet(StoreKey.serverEndpoint);
    if (endpoint != null && endpoint.isNotEmpty) {
      setEndpoint(endpoint);
    }
  }
  String? _accessToken;
  final _log = Logger("ApiService");

  setEndpoint(String endpoint) {
    _apiClient = ApiClient(basePath: endpoint, authentication: this);
    if (_accessToken != null) {
      setAccessToken(_accessToken!);
    }
    usersApi = UsersApi(_apiClient);
    authenticationApi = AuthenticationApi(_apiClient);
    oAuthApi = OAuthApi(_apiClient);
    albumsApi = AlbumsApi(_apiClient);
    assetsApi = AssetsApi(_apiClient);
    serverInfoApi = ServerApi(_apiClient);
    searchApi = SearchApi(_apiClient);
    mapApi = MapApi(_apiClient);
    partnersApi = PartnersApi(_apiClient);
    peopleApi = PeopleApi(_apiClient);
    auditApi = AuditApi(_apiClient);
    sharedLinksApi = SharedLinksApi(_apiClient);
    syncApi = SyncApi(_apiClient);
    systemConfigApi = SystemConfigApi(_apiClient);
    activitiesApi = ActivitiesApi(_apiClient);
    downloadApi = DownloadApi(_apiClient);
    trashApi = TrashApi(_apiClient);
    stacksApi = StacksApi(_apiClient);
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
    if (!serverUrl.endsWith('/api')) {
      serverUrl += '/api';
    }

    try {
      await setEndpoint(serverUrl);
      await serverInfoApi.pingServer().timeout(Duration(seconds: 5));
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
      var headers = {"Accept": "application/json"};
      headers.addAll(getRequestHeaders());

      final res = await client.get(
        Uri.parse("$baseUrl/.well-known/immich"),
        headers: headers,
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
    Store.put(StoreKey.accessToken, accessToken);
  }

  static Map<String, String> getRequestHeaders() {
    var accessToken = Store.get(StoreKey.accessToken, "");
    var customHeadersStr = Store.get(StoreKey.customHeaders, "");
    var header = <String, String>{};
    if (accessToken.isNotEmpty) {
      header['x-immich-user-token'] = accessToken;
    }

    if (customHeadersStr.isEmpty) {
      return header;
    }

    var customHeaders = jsonDecode(customHeadersStr) as Map;
    customHeaders.forEach((key, value) {
      header[key] = value;
    });

    return header;
  }

  @override
  Future<void> applyToParams(
    List<QueryParam> queryParams,
    Map<String, String> headerParams,
  ) {
    return Future<void>(() {
      var headers = ApiService.getRequestHeaders();
      headerParams.addAll(headers);
    });
  }

  ApiClient get apiClient => _apiClient;
}
