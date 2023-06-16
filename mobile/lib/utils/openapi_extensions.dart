import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart';
import 'package:openapi/api.dart';

/// Extension methods to retrieve ETag together with the API call
extension WithETag on AssetApi {
  /// Get all AssetEntity belong to the user
  ///
  /// Parameters:
  ///
  /// * [String] eTag:
  ///   ETag of data already cached on the client
  Future<(List<AssetResponseDto>? assets, String? eTag)> getAllAssetsWithETag({
    String? eTag,
    String? userId,
    bool? isFavorite,
    bool? isArchived,
    bool? withoutThumbs,
  }) async {
    final response = await getAllAssetsWithHttpInfo(
      ifNoneMatch: eTag,
      userId: userId,
      isFavorite: isFavorite,
      isArchived: isArchived,
      withoutThumbs: withoutThumbs,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty &&
        response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      final etag = response.headers[HttpHeaders.etagHeader];
      final data = (await apiClient.deserializeAsync(
        responseBody,
        'List<AssetResponseDto>',
      ) as List)
          .cast<AssetResponseDto>()
          .toList();
      return (data, etag);
    }
    return (null, null);
  }
}

/// Returns the decoded body as UTF-8 if the given headers indicate an 'application/json'
/// content type. Otherwise, returns the decoded body as decoded by dart:http package.
Future<String> _decodeBodyBytes(Response response) async {
  final contentType = response.headers['content-type'];
  return contentType != null &&
          contentType.toLowerCase().startsWith('application/json')
      ? response.bodyBytes.isEmpty
          ? ''
          : utf8.decode(response.bodyBytes)
      : response.body;
}
