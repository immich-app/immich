import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:punycode/punycode.dart';

String sanitizeUrl(String url) {
  // Add schema if none is set
  final urlWithSchema =
      url.trimLeft().startsWith(RegExp(r"https?://")) ? url : "https://$url";

  // Remove trailing slash(es)
  return urlWithSchema.trimRight().replaceFirst(RegExp(r"/+$"), "");
}

String? getServerUrl() {
  final serverUrl = punycodeDecodeUrl(Store.tryGet(StoreKey.serverEndpoint));
  final serverUri = serverUrl != null ? Uri.tryParse(serverUrl) : null;
  if (serverUri == null) {
    return null;
  }

  return Uri.decodeFull(
    serverUri.hasPort
        ? "${serverUri.scheme}://${serverUri.host}:${serverUri.port}"
        : "${serverUri.scheme}://${serverUri.host}",
  );
}

/// Converts a Unicode URL to its ASCII-compatible encoding (Punycode).
///
/// This is especially useful for internationalized domain names (IDNs),
/// where parts of the URL (typically the host) contain non-ASCII characters.
///
/// Example:
/// ```dart
/// final encodedUrl = punycodeEncodeUrl('https://bücher.de');
/// print(encodedUrl); // Outputs: https://xn--bcher-kva.de
/// ```
///
/// Notes:
/// - If the input URL is invalid, an empty string is returned.
/// - Only the host part of the URL is converted to Punycode; the scheme,
///   path, and port remain unchanged.
///
String punycodeEncodeUrl(String serverUrl) {
  final serverUri = Uri.tryParse(serverUrl);
  if (serverUri == null || serverUri.host.isEmpty) return '';

  final encodedHost = Uri.decodeComponent(serverUri.host).split('.').map(
    (segment) {
      // If segment is already ASCII, then return as it is.
      if (segment.runes.every((c) => c < 0x80)) return segment;
      return 'xn--${punycodeEncode(segment)}';
    },
  ).join('.');

  return serverUri.replace(host: encodedHost).toString();
}

/// Decodes an ASCII-compatible (Punycode) URL back to its original Unicode representation.
///
/// This method is useful for converting internationalized domain names (IDNs)
/// that were previously encoded with Punycode back to their human-readable Unicode form.
///
/// Example:
/// ```dart
/// final decodedUrl = punycodeDecodeUrl('https://xn--bcher-kva.de');
/// print(decodedUrl); // Outputs: https://bücher.de
/// ```
///
/// Notes:
/// - If the input URL is invalid the method returns `null`.
/// - Only the host part of the URL is decoded. The scheme and port (if any) are preserved.
/// - The method assumes that the input URL only contains: scheme, host, port (optional).
/// - Query parameters, fragments, and user info are not handled (by design, as per constraints).
///
String? punycodeDecodeUrl(String? serverUrl) {
  final serverUri = serverUrl != null ? Uri.tryParse(serverUrl) : null;
  if (serverUri == null || serverUri.host.isEmpty) return null;

  final decodedHost = serverUri.host.split('.').map(
    (segment) {
      if (segment.toLowerCase().startsWith('xn--')) {
        return punycodeDecode(segment.substring(4));
      }
      // If segment is not punycode encoded, then return as it is.
      return segment;
    },
  ).join('.');

  return Uri.decodeFull(serverUri.replace(host: decodedHost).toString());
}
