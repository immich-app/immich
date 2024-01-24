import 'dart:convert';
import 'package:immich_mobile/shared/models/store.dart';

String sanitizeUrl(String url) {
  // Add schema if none is set
  final urlWithSchema =
      url.trimLeft().startsWith(RegExp(r"https?://")) ? url : "https://$url";

  // Remove trailing slash(es)
  return urlWithSchema.trimRight().replaceFirst(RegExp(r"/+$"), "");
}

String? getServerUrl() {
  final serverUrl = Store.tryGet(StoreKey.serverEndpoint);
  final serverUri = serverUrl != null ? Uri.tryParse(serverUrl) : null;
  if (serverUri == null) {
    return null;
  }

  return serverUri.hasPort
      ? "${serverUri.scheme}://${serverUri.host}:${serverUri.port}"
      : "${serverUri.scheme}://${serverUri.host}";
}

Map<String, String> getAuthHeaders(String url, String? accessToken) {
  final uri = Uri.parse(url);
  Map<String, String> headers = {};

  if(uri.userInfo.contains(":")) { //need BasicAuth, use custom header for Bearer Auth
    headers['Authorization'] = "Basic ${base64.encode(utf8.encode(uri.userInfo))}";

    if(accessToken != null) {
      headers['x-immich-user-token'] = accessToken;
    }

  } else if(accessToken != null) {
    headers['Authorization'] = 'Bearer $accessToken';
  }

  return headers;
}