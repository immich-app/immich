import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:openapi/api.dart';

extension UsersApiExtension on UsersApi {
  /// Override getMyUserPreference to avoid breaking the client
  /// when there are new properties get added to the response
  Future<UserPreferencesResponseDto?> getMyPreferencesExtended() async {
    final response = await getMyPreferencesWithHttpInfo();

    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(
        response.statusCode,
        await _decodeBodyBytes(response),
      );
    }

    if (response.body.isNotEmpty &&
        response.statusCode != HttpStatus.noContent) {
      String decodedBytes = await _decodeBodyBytes(response);
      dynamic jsonString =
          await compute((String j) => json.decode(j), decodedBytes);

      ///
      /// START PATCHING `UserPreferencesResponseDto` HERE
      ///

      // patching `rating` with the default value
      if (jsonString['rating'] == null) {
        jsonString['rating'] = jsonEncode(RatingResponse(enabled: false));
      }

      return UserPreferencesResponseDto.fromJson(json.encode(jsonString));
    }

    return null;
  }

  Future<String> _decodeBodyBytes(Response response) async {
    final contentType = response.headers['content-type'];
    return contentType != null &&
            contentType.toLowerCase().startsWith('application/json')
        ? response.bodyBytes.isEmpty
            ? ''
            : utf8.decode(response.bodyBytes)
        : response.body;
  }
}
