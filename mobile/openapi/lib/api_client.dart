//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ApiClient {
  ApiClient({this.basePath = '/api', this.authentication,});

  final String basePath;
  final Authentication? authentication;

  var _client = Client();
  final _defaultHeaderMap = <String, String>{};

  /// Returns the current HTTP [Client] instance to use in this class.
  ///
  /// The return value is guaranteed to never be null.
  Client get client => _client;

  /// Requests to use a new HTTP [Client] in this class.
  set client(Client newClient) {
    _client = newClient;
  }

  Map<String, String> get defaultHeaderMap => _defaultHeaderMap;

  void addDefaultHeader(String key, String value) {
     _defaultHeaderMap[key] = value;
  }

  // We don't use a Map<String, String> for queryParams.
  // If collectionFormat is 'multi', a key might appear multiple times.
  Future<Response> invokeAPI(
    String path,
    String method,
    List<QueryParam> queryParams,
    Object? body,
    Map<String, String> headerParams,
    Map<String, String> formParams,
    String? contentType,
  ) async {
    await authentication?.applyToParams(queryParams, headerParams);

    headerParams.addAll(_defaultHeaderMap);
    if (contentType != null) {
      headerParams['Content-Type'] = contentType;
    }

    final urlEncodedQueryParams = queryParams.map((param) => '$param');
    final queryString = urlEncodedQueryParams.isNotEmpty ? '?${urlEncodedQueryParams.join('&')}' : '';
    final uri = Uri.parse('$basePath$path$queryString');

    try {
      // Special case for uploading a single file which isn't a 'multipart/form-data'.
      if (
        body is MultipartFile && (contentType == null ||
        !contentType.toLowerCase().startsWith('multipart/form-data'))
      ) {
        final request = StreamedRequest(method, uri);
        request.headers.addAll(headerParams);
        request.contentLength = body.length;
        body.finalize().listen(
          request.sink.add,
          onDone: request.sink.close,
          // ignore: avoid_types_on_closure_parameters
          onError: (Object error, StackTrace trace) => request.sink.close(),
          cancelOnError: true,
        );
        final response = await _client.send(request);
        return Response.fromStream(response);
      }

      if (body is MultipartRequest) {
        final request = MultipartRequest(method, uri);
        request.fields.addAll(body.fields);
        request.files.addAll(body.files);
        request.headers.addAll(body.headers);
        request.headers.addAll(headerParams);
        final response = await _client.send(request);
        return Response.fromStream(response);
      }

      final msgBody = contentType == 'application/x-www-form-urlencoded'
        ? formParams
        : await serializeAsync(body);
      final nullableHeaderParams = headerParams.isEmpty ? null : headerParams;

      switch(method) {
        case 'POST': return await _client.post(uri, headers: nullableHeaderParams, body: msgBody,);
        case 'PUT': return await _client.put(uri, headers: nullableHeaderParams, body: msgBody,);
        case 'DELETE': return await _client.delete(uri, headers: nullableHeaderParams, body: msgBody,);
        case 'PATCH': return await _client.patch(uri, headers: nullableHeaderParams, body: msgBody,);
        case 'HEAD': return await _client.head(uri, headers: nullableHeaderParams,);
        case 'GET': return await _client.get(uri, headers: nullableHeaderParams,);
      }
    } on SocketException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'Socket operation failed: $method $path',
        error,
        trace,
      );
    } on TlsException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'TLS/SSL communication failed: $method $path',
        error,
        trace,
      );
    } on IOException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'I/O operation failed: $method $path',
        error,
        trace,
      );
    } on ClientException catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'HTTP connection failed: $method $path',
        error,
        trace,
      );
    } on Exception catch (error, trace) {
      throw ApiException.withInner(
        HttpStatus.badRequest,
        'Exception occurred: $method $path',
        error,
        trace,
      );
    }

    throw ApiException(
      HttpStatus.badRequest,
      'Invalid HTTP operation: $method $path',
    );
  }

  Future<dynamic> deserializeAsync(String value, String targetType, {bool growable = false,}) =>
    // ignore: deprecated_member_use_from_same_package
    deserialize(value, targetType, growable: growable);

  @Deprecated('Scheduled for removal in OpenAPI Generator 6.x. Use deserializeAsync() instead.')
  Future<dynamic> deserialize(String value, String targetType, {bool growable = false,}) async {
    // Remove all spaces. Necessary for regular expressions as well.
    targetType = targetType.replaceAll(' ', ''); // ignore: parameter_assignments

    // If the expected target type is String, nothing to do...
    return targetType == 'String'
      ? value
      : fromJson(await compute((String j) => json.decode(j), value), targetType, growable: growable);
  }

  // ignore: deprecated_member_use_from_same_package
  Future<String> serializeAsync(Object? value) async => serialize(value);

  @Deprecated('Scheduled for removal in OpenAPI Generator 6.x. Use serializeAsync() instead.')
  String serialize(Object? value) => value == null ? '' : json.encode(value);

  /// Returns a native instance of an OpenAPI class matching the [specified type][targetType].
  static dynamic fromJson(dynamic value, String targetType, {bool growable = false,}) {
    try {
      switch (targetType) {
        case 'String':
          return value is String ? value : value.toString();
        case 'int':
          return value is int ? value : int.parse('$value');
        case 'double':
          return value is double ? value : double.parse('$value');
        case 'bool':
          if (value is bool) {
            return value;
          }
          final valueString = '$value'.toLowerCase();
          return valueString == 'true' || valueString == '1';
        case 'DateTime':
          return value is DateTime ? value : DateTime.tryParse(value);
        case 'APIKeyCreateDto':
          return APIKeyCreateDto.fromJson(value);
        case 'APIKeyCreateResponseDto':
          return APIKeyCreateResponseDto.fromJson(value);
        case 'APIKeyResponseDto':
          return APIKeyResponseDto.fromJson(value);
        case 'APIKeyUpdateDto':
          return APIKeyUpdateDto.fromJson(value);
        case 'ActivityCreateDto':
          return ActivityCreateDto.fromJson(value);
        case 'ActivityResponseDto':
          return ActivityResponseDto.fromJson(value);
        case 'ActivityStatisticsResponseDto':
          return ActivityStatisticsResponseDto.fromJson(value);
        case 'AddUsersDto':
          return AddUsersDto.fromJson(value);
        case 'AlbumCountResponseDto':
          return AlbumCountResponseDto.fromJson(value);
        case 'AlbumResponseDto':
          return AlbumResponseDto.fromJson(value);
        case 'AllJobStatusResponseDto':
          return AllJobStatusResponseDto.fromJson(value);
        case 'AssetBulkDeleteDto':
          return AssetBulkDeleteDto.fromJson(value);
        case 'AssetBulkUpdateDto':
          return AssetBulkUpdateDto.fromJson(value);
        case 'AssetBulkUploadCheckDto':
          return AssetBulkUploadCheckDto.fromJson(value);
        case 'AssetBulkUploadCheckItem':
          return AssetBulkUploadCheckItem.fromJson(value);
        case 'AssetBulkUploadCheckResponseDto':
          return AssetBulkUploadCheckResponseDto.fromJson(value);
        case 'AssetBulkUploadCheckResult':
          return AssetBulkUploadCheckResult.fromJson(value);
        case 'AssetFaceResponseDto':
          return AssetFaceResponseDto.fromJson(value);
        case 'AssetFaceUpdateDto':
          return AssetFaceUpdateDto.fromJson(value);
        case 'AssetFaceUpdateItem':
          return AssetFaceUpdateItem.fromJson(value);
        case 'AssetFaceWithoutPersonResponseDto':
          return AssetFaceWithoutPersonResponseDto.fromJson(value);
        case 'AssetFileUploadResponseDto':
          return AssetFileUploadResponseDto.fromJson(value);
        case 'AssetIdsDto':
          return AssetIdsDto.fromJson(value);
        case 'AssetIdsResponseDto':
          return AssetIdsResponseDto.fromJson(value);
        case 'AssetJobName':
          return AssetJobNameTypeTransformer().decode(value);
        case 'AssetJobsDto':
          return AssetJobsDto.fromJson(value);
        case 'AssetOrder':
          return AssetOrderTypeTransformer().decode(value);
        case 'AssetResponseDto':
          return AssetResponseDto.fromJson(value);
        case 'AssetStatsResponseDto':
          return AssetStatsResponseDto.fromJson(value);
        case 'AssetTypeEnum':
          return AssetTypeEnumTypeTransformer().decode(value);
        case 'AudioCodec':
          return AudioCodecTypeTransformer().decode(value);
        case 'AuditDeletesResponseDto':
          return AuditDeletesResponseDto.fromJson(value);
        case 'AuthDeviceResponseDto':
          return AuthDeviceResponseDto.fromJson(value);
        case 'BulkIdResponseDto':
          return BulkIdResponseDto.fromJson(value);
        case 'BulkIdsDto':
          return BulkIdsDto.fromJson(value);
        case 'CLIPConfig':
          return CLIPConfig.fromJson(value);
        case 'CLIPMode':
          return CLIPModeTypeTransformer().decode(value);
        case 'CQMode':
          return CQModeTypeTransformer().decode(value);
        case 'ChangePasswordDto':
          return ChangePasswordDto.fromJson(value);
        case 'CheckExistingAssetsDto':
          return CheckExistingAssetsDto.fromJson(value);
        case 'CheckExistingAssetsResponseDto':
          return CheckExistingAssetsResponseDto.fromJson(value);
        case 'Colorspace':
          return ColorspaceTypeTransformer().decode(value);
        case 'CreateAlbumDto':
          return CreateAlbumDto.fromJson(value);
        case 'CreateLibraryDto':
          return CreateLibraryDto.fromJson(value);
        case 'CreateProfileImageResponseDto':
          return CreateProfileImageResponseDto.fromJson(value);
        case 'CreateTagDto':
          return CreateTagDto.fromJson(value);
        case 'CreateUserDto':
          return CreateUserDto.fromJson(value);
        case 'CuratedLocationsResponseDto':
          return CuratedLocationsResponseDto.fromJson(value);
        case 'CuratedObjectsResponseDto':
          return CuratedObjectsResponseDto.fromJson(value);
        case 'DownloadArchiveInfo':
          return DownloadArchiveInfo.fromJson(value);
        case 'DownloadInfoDto':
          return DownloadInfoDto.fromJson(value);
        case 'DownloadResponseDto':
          return DownloadResponseDto.fromJson(value);
        case 'EntityType':
          return EntityTypeTypeTransformer().decode(value);
        case 'ExifResponseDto':
          return ExifResponseDto.fromJson(value);
        case 'FaceDto':
          return FaceDto.fromJson(value);
        case 'FileChecksumDto':
          return FileChecksumDto.fromJson(value);
        case 'FileChecksumResponseDto':
          return FileChecksumResponseDto.fromJson(value);
        case 'FileReportDto':
          return FileReportDto.fromJson(value);
        case 'FileReportFixDto':
          return FileReportFixDto.fromJson(value);
        case 'FileReportItemDto':
          return FileReportItemDto.fromJson(value);
        case 'JobCommand':
          return JobCommandTypeTransformer().decode(value);
        case 'JobCommandDto':
          return JobCommandDto.fromJson(value);
        case 'JobCountsDto':
          return JobCountsDto.fromJson(value);
        case 'JobName':
          return JobNameTypeTransformer().decode(value);
        case 'JobSettingsDto':
          return JobSettingsDto.fromJson(value);
        case 'JobStatusDto':
          return JobStatusDto.fromJson(value);
        case 'LibraryResponseDto':
          return LibraryResponseDto.fromJson(value);
        case 'LibraryStatsResponseDto':
          return LibraryStatsResponseDto.fromJson(value);
        case 'LibraryType':
          return LibraryTypeTypeTransformer().decode(value);
        case 'LogLevel':
          return LogLevelTypeTransformer().decode(value);
        case 'LoginCredentialDto':
          return LoginCredentialDto.fromJson(value);
        case 'LoginResponseDto':
          return LoginResponseDto.fromJson(value);
        case 'LogoutResponseDto':
          return LogoutResponseDto.fromJson(value);
        case 'MapMarkerResponseDto':
          return MapMarkerResponseDto.fromJson(value);
        case 'MapTheme':
          return MapThemeTypeTransformer().decode(value);
        case 'MemoryLaneResponseDto':
          return MemoryLaneResponseDto.fromJson(value);
        case 'MergePersonDto':
          return MergePersonDto.fromJson(value);
        case 'ModelType':
          return ModelTypeTypeTransformer().decode(value);
        case 'OAuthAuthorizeResponseDto':
          return OAuthAuthorizeResponseDto.fromJson(value);
        case 'OAuthCallbackDto':
          return OAuthCallbackDto.fromJson(value);
        case 'OAuthConfigDto':
          return OAuthConfigDto.fromJson(value);
        case 'PartnerResponseDto':
          return PartnerResponseDto.fromJson(value);
        case 'PathEntityType':
          return PathEntityTypeTypeTransformer().decode(value);
        case 'PathType':
          return PathTypeTypeTransformer().decode(value);
        case 'PeopleResponseDto':
          return PeopleResponseDto.fromJson(value);
        case 'PeopleUpdateDto':
          return PeopleUpdateDto.fromJson(value);
        case 'PeopleUpdateItem':
          return PeopleUpdateItem.fromJson(value);
        case 'PersonResponseDto':
          return PersonResponseDto.fromJson(value);
        case 'PersonStatisticsResponseDto':
          return PersonStatisticsResponseDto.fromJson(value);
        case 'PersonUpdateDto':
          return PersonUpdateDto.fromJson(value);
        case 'PersonWithFacesResponseDto':
          return PersonWithFacesResponseDto.fromJson(value);
        case 'QueueStatusDto':
          return QueueStatusDto.fromJson(value);
        case 'ReactionLevel':
          return ReactionLevelTypeTransformer().decode(value);
        case 'ReactionType':
          return ReactionTypeTypeTransformer().decode(value);
        case 'RecognitionConfig':
          return RecognitionConfig.fromJson(value);
        case 'ScanLibraryDto':
          return ScanLibraryDto.fromJson(value);
        case 'SearchAlbumResponseDto':
          return SearchAlbumResponseDto.fromJson(value);
        case 'SearchAssetResponseDto':
          return SearchAssetResponseDto.fromJson(value);
        case 'SearchExploreItem':
          return SearchExploreItem.fromJson(value);
        case 'SearchExploreResponseDto':
          return SearchExploreResponseDto.fromJson(value);
        case 'SearchFacetCountResponseDto':
          return SearchFacetCountResponseDto.fromJson(value);
        case 'SearchFacetResponseDto':
          return SearchFacetResponseDto.fromJson(value);
        case 'SearchResponseDto':
          return SearchResponseDto.fromJson(value);
        case 'ServerConfigDto':
          return ServerConfigDto.fromJson(value);
        case 'ServerFeaturesDto':
          return ServerFeaturesDto.fromJson(value);
        case 'ServerInfoResponseDto':
          return ServerInfoResponseDto.fromJson(value);
        case 'ServerMediaTypesResponseDto':
          return ServerMediaTypesResponseDto.fromJson(value);
        case 'ServerPingResponse':
          return ServerPingResponse.fromJson(value);
        case 'ServerStatsResponseDto':
          return ServerStatsResponseDto.fromJson(value);
        case 'ServerThemeDto':
          return ServerThemeDto.fromJson(value);
        case 'ServerVersionResponseDto':
          return ServerVersionResponseDto.fromJson(value);
        case 'SharedLinkCreateDto':
          return SharedLinkCreateDto.fromJson(value);
        case 'SharedLinkEditDto':
          return SharedLinkEditDto.fromJson(value);
        case 'SharedLinkResponseDto':
          return SharedLinkResponseDto.fromJson(value);
        case 'SharedLinkType':
          return SharedLinkTypeTypeTransformer().decode(value);
        case 'SignUpDto':
          return SignUpDto.fromJson(value);
        case 'SmartInfoResponseDto':
          return SmartInfoResponseDto.fromJson(value);
        case 'SystemConfigDto':
          return SystemConfigDto.fromJson(value);
        case 'SystemConfigFFmpegDto':
          return SystemConfigFFmpegDto.fromJson(value);
        case 'SystemConfigJobDto':
          return SystemConfigJobDto.fromJson(value);
        case 'SystemConfigLibraryDto':
          return SystemConfigLibraryDto.fromJson(value);
        case 'SystemConfigLibraryScanDto':
          return SystemConfigLibraryScanDto.fromJson(value);
        case 'SystemConfigLibraryWatchDto':
          return SystemConfigLibraryWatchDto.fromJson(value);
        case 'SystemConfigLoggingDto':
          return SystemConfigLoggingDto.fromJson(value);
        case 'SystemConfigMachineLearningDto':
          return SystemConfigMachineLearningDto.fromJson(value);
        case 'SystemConfigMapDto':
          return SystemConfigMapDto.fromJson(value);
        case 'SystemConfigNewVersionCheckDto':
          return SystemConfigNewVersionCheckDto.fromJson(value);
        case 'SystemConfigOAuthDto':
          return SystemConfigOAuthDto.fromJson(value);
        case 'SystemConfigPasswordLoginDto':
          return SystemConfigPasswordLoginDto.fromJson(value);
        case 'SystemConfigReverseGeocodingDto':
          return SystemConfigReverseGeocodingDto.fromJson(value);
        case 'SystemConfigServerDto':
          return SystemConfigServerDto.fromJson(value);
        case 'SystemConfigStorageTemplateDto':
          return SystemConfigStorageTemplateDto.fromJson(value);
        case 'SystemConfigTemplateStorageOptionDto':
          return SystemConfigTemplateStorageOptionDto.fromJson(value);
        case 'SystemConfigThemeDto':
          return SystemConfigThemeDto.fromJson(value);
        case 'SystemConfigThumbnailDto':
          return SystemConfigThumbnailDto.fromJson(value);
        case 'SystemConfigTrashDto':
          return SystemConfigTrashDto.fromJson(value);
        case 'TagResponseDto':
          return TagResponseDto.fromJson(value);
        case 'TagTypeEnum':
          return TagTypeEnumTypeTransformer().decode(value);
        case 'ThumbnailFormat':
          return ThumbnailFormatTypeTransformer().decode(value);
        case 'TimeBucketResponseDto':
          return TimeBucketResponseDto.fromJson(value);
        case 'TimeBucketSize':
          return TimeBucketSizeTypeTransformer().decode(value);
        case 'ToneMapping':
          return ToneMappingTypeTransformer().decode(value);
        case 'TranscodeHWAccel':
          return TranscodeHWAccelTypeTransformer().decode(value);
        case 'TranscodePolicy':
          return TranscodePolicyTypeTransformer().decode(value);
        case 'UpdateAlbumDto':
          return UpdateAlbumDto.fromJson(value);
        case 'UpdateAssetDto':
          return UpdateAssetDto.fromJson(value);
        case 'UpdateLibraryDto':
          return UpdateLibraryDto.fromJson(value);
        case 'UpdatePartnerDto':
          return UpdatePartnerDto.fromJson(value);
        case 'UpdateStackParentDto':
          return UpdateStackParentDto.fromJson(value);
        case 'UpdateTagDto':
          return UpdateTagDto.fromJson(value);
        case 'UpdateUserDto':
          return UpdateUserDto.fromJson(value);
        case 'UsageByUserDto':
          return UsageByUserDto.fromJson(value);
        case 'UserAvatarColor':
          return UserAvatarColorTypeTransformer().decode(value);
        case 'UserDto':
          return UserDto.fromJson(value);
        case 'UserResponseDto':
          return UserResponseDto.fromJson(value);
        case 'ValidateAccessTokenResponseDto':
          return ValidateAccessTokenResponseDto.fromJson(value);
        case 'VideoCodec':
          return VideoCodecTypeTransformer().decode(value);
        default:
          dynamic match;
          if (value is List && (match = _regList.firstMatch(targetType)?.group(1)) != null) {
            return value
              .map<dynamic>((dynamic v) => fromJson(v, match, growable: growable,))
              .toList(growable: growable);
          }
          if (value is Set && (match = _regSet.firstMatch(targetType)?.group(1)) != null) {
            return value
              .map<dynamic>((dynamic v) => fromJson(v, match, growable: growable,))
              .toSet();
          }
          if (value is Map && (match = _regMap.firstMatch(targetType)?.group(1)) != null) {
            return Map<String, dynamic>.fromIterables(
              value.keys.cast<String>(),
              value.values.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable,)),
            );
          }
      }
    } on Exception catch (error, trace) {
      throw ApiException.withInner(HttpStatus.internalServerError, 'Exception during deserialization.', error, trace,);
    }
    throw ApiException(HttpStatus.internalServerError, 'Could not find a suitable class for deserialization',);
  }
}

/// Primarily intended for use in an isolate.
class DeserializationMessage {
  const DeserializationMessage({
    required this.json,
    required this.targetType,
    this.growable = false,
  });

  /// The JSON value to deserialize.
  final String json;

  /// Target type to deserialize to.
  final String targetType;

  /// Whether to make deserialized lists or maps growable.
  final bool growable;
}

/// Primarily intended for use in an isolate.
Future<dynamic> decodeAsync(DeserializationMessage message) async {
  // Remove all spaces. Necessary for regular expressions as well.
  final targetType = message.targetType.replaceAll(' ', '');

  // If the expected target type is String, nothing to do...
  return targetType == 'String'
    ? message.json
    : json.decode(message.json);
}

/// Primarily intended for use in an isolate.
Future<dynamic> deserializeAsync(DeserializationMessage message) async {
  // Remove all spaces. Necessary for regular expressions as well.
  final targetType = message.targetType.replaceAll(' ', '');

  // If the expected target type is String, nothing to do...
  return targetType == 'String'
    ? message.json
    : ApiClient.fromJson(
        json.decode(message.json),
        targetType,
        growable: message.growable,
      );
}

/// Primarily intended for use in an isolate.
Future<String> serializeAsync(Object? value) async => value == null ? '' : json.encode(value);
