//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

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
        case 'AdminOnboardingUpdateDto':
          return AdminOnboardingUpdateDto.fromJson(value);
        case 'AlbumResponseDto':
          return AlbumResponseDto.fromJson(value);
        case 'AlbumStatisticsResponseDto':
          return AlbumStatisticsResponseDto.fromJson(value);
        case 'AlbumUserAddDto':
          return AlbumUserAddDto.fromJson(value);
        case 'AlbumUserCreateDto':
          return AlbumUserCreateDto.fromJson(value);
        case 'AlbumUserResponseDto':
          return AlbumUserResponseDto.fromJson(value);
        case 'AlbumUserRole':
          return AlbumUserRoleTypeTransformer().decode(value);
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
        case 'AssetDeltaSyncDto':
          return AssetDeltaSyncDto.fromJson(value);
        case 'AssetDeltaSyncResponseDto':
          return AssetDeltaSyncResponseDto.fromJson(value);
        case 'AssetFaceResponseDto':
          return AssetFaceResponseDto.fromJson(value);
        case 'AssetFaceUpdateDto':
          return AssetFaceUpdateDto.fromJson(value);
        case 'AssetFaceUpdateItem':
          return AssetFaceUpdateItem.fromJson(value);
        case 'AssetFaceWithoutPersonResponseDto':
          return AssetFaceWithoutPersonResponseDto.fromJson(value);
        case 'AssetFullSyncDto':
          return AssetFullSyncDto.fromJson(value);
        case 'AssetIdsDto':
          return AssetIdsDto.fromJson(value);
        case 'AssetIdsResponseDto':
          return AssetIdsResponseDto.fromJson(value);
        case 'AssetJobName':
          return AssetJobNameTypeTransformer().decode(value);
        case 'AssetJobsDto':
          return AssetJobsDto.fromJson(value);
        case 'AssetMediaResponseDto':
          return AssetMediaResponseDto.fromJson(value);
        case 'AssetMediaSize':
          return AssetMediaSizeTypeTransformer().decode(value);
        case 'AssetMediaStatus':
          return AssetMediaStatusTypeTransformer().decode(value);
        case 'AssetOrder':
          return AssetOrderTypeTransformer().decode(value);
        case 'AssetResponseDto':
          return AssetResponseDto.fromJson(value);
        case 'AssetStackResponseDto':
          return AssetStackResponseDto.fromJson(value);
        case 'AssetStatsResponseDto':
          return AssetStatsResponseDto.fromJson(value);
        case 'AssetTypeEnum':
          return AssetTypeEnumTypeTransformer().decode(value);
        case 'AudioCodec':
          return AudioCodecTypeTransformer().decode(value);
        case 'AuditDeletesResponseDto':
          return AuditDeletesResponseDto.fromJson(value);
        case 'AvatarResponse':
          return AvatarResponse.fromJson(value);
        case 'AvatarUpdate':
          return AvatarUpdate.fromJson(value);
        case 'BulkIdResponseDto':
          return BulkIdResponseDto.fromJson(value);
        case 'BulkIdsDto':
          return BulkIdsDto.fromJson(value);
        case 'CLIPConfig':
          return CLIPConfig.fromJson(value);
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
        case 'DownloadArchiveInfo':
          return DownloadArchiveInfo.fromJson(value);
        case 'DownloadInfoDto':
          return DownloadInfoDto.fromJson(value);
        case 'DownloadResponse':
          return DownloadResponse.fromJson(value);
        case 'DownloadResponseDto':
          return DownloadResponseDto.fromJson(value);
        case 'DownloadUpdate':
          return DownloadUpdate.fromJson(value);
        case 'DuplicateDetectionConfig':
          return DuplicateDetectionConfig.fromJson(value);
        case 'DuplicateResponseDto':
          return DuplicateResponseDto.fromJson(value);
        case 'EmailNotificationsResponse':
          return EmailNotificationsResponse.fromJson(value);
        case 'EmailNotificationsUpdate':
          return EmailNotificationsUpdate.fromJson(value);
        case 'EntityType':
          return EntityTypeTypeTransformer().decode(value);
        case 'ExifResponseDto':
          return ExifResponseDto.fromJson(value);
        case 'FaceDto':
          return FaceDto.fromJson(value);
        case 'FacialRecognitionConfig':
          return FacialRecognitionConfig.fromJson(value);
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
        case 'FoldersResponse':
          return FoldersResponse.fromJson(value);
        case 'FoldersUpdate':
          return FoldersUpdate.fromJson(value);
        case 'ImageFormat':
          return ImageFormatTypeTransformer().decode(value);
        case 'JobCommand':
          return JobCommandTypeTransformer().decode(value);
        case 'JobCommandDto':
          return JobCommandDto.fromJson(value);
        case 'JobCountsDto':
          return JobCountsDto.fromJson(value);
        case 'JobCreateDto':
          return JobCreateDto.fromJson(value);
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
        case 'LicenseKeyDto':
          return LicenseKeyDto.fromJson(value);
        case 'LicenseResponseDto':
          return LicenseResponseDto.fromJson(value);
        case 'LogLevel':
          return LogLevelTypeTransformer().decode(value);
        case 'LoginCredentialDto':
          return LoginCredentialDto.fromJson(value);
        case 'LoginResponseDto':
          return LoginResponseDto.fromJson(value);
        case 'LogoutResponseDto':
          return LogoutResponseDto.fromJson(value);
        case 'ManualJobName':
          return ManualJobNameTypeTransformer().decode(value);
        case 'MapMarkerResponseDto':
          return MapMarkerResponseDto.fromJson(value);
        case 'MapReverseGeocodeResponseDto':
          return MapReverseGeocodeResponseDto.fromJson(value);
        case 'MemoriesResponse':
          return MemoriesResponse.fromJson(value);
        case 'MemoriesUpdate':
          return MemoriesUpdate.fromJson(value);
        case 'MemoryCreateDto':
          return MemoryCreateDto.fromJson(value);
        case 'MemoryLaneResponseDto':
          return MemoryLaneResponseDto.fromJson(value);
        case 'MemoryResponseDto':
          return MemoryResponseDto.fromJson(value);
        case 'MemoryType':
          return MemoryTypeTypeTransformer().decode(value);
        case 'MemoryUpdateDto':
          return MemoryUpdateDto.fromJson(value);
        case 'MergePersonDto':
          return MergePersonDto.fromJson(value);
        case 'MetadataSearchDto':
          return MetadataSearchDto.fromJson(value);
        case 'OAuthAuthorizeResponseDto':
          return OAuthAuthorizeResponseDto.fromJson(value);
        case 'OAuthCallbackDto':
          return OAuthCallbackDto.fromJson(value);
        case 'OAuthConfigDto':
          return OAuthConfigDto.fromJson(value);
        case 'OnThisDayDto':
          return OnThisDayDto.fromJson(value);
        case 'PartnerDirection':
          return PartnerDirectionTypeTransformer().decode(value);
        case 'PartnerResponseDto':
          return PartnerResponseDto.fromJson(value);
        case 'PathEntityType':
          return PathEntityTypeTypeTransformer().decode(value);
        case 'PathType':
          return PathTypeTypeTransformer().decode(value);
        case 'PeopleResponse':
          return PeopleResponse.fromJson(value);
        case 'PeopleResponseDto':
          return PeopleResponseDto.fromJson(value);
        case 'PeopleUpdate':
          return PeopleUpdate.fromJson(value);
        case 'PeopleUpdateDto':
          return PeopleUpdateDto.fromJson(value);
        case 'PeopleUpdateItem':
          return PeopleUpdateItem.fromJson(value);
        case 'Permission':
          return PermissionTypeTransformer().decode(value);
        case 'PersonCreateDto':
          return PersonCreateDto.fromJson(value);
        case 'PersonResponseDto':
          return PersonResponseDto.fromJson(value);
        case 'PersonStatisticsResponseDto':
          return PersonStatisticsResponseDto.fromJson(value);
        case 'PersonUpdateDto':
          return PersonUpdateDto.fromJson(value);
        case 'PersonWithFacesResponseDto':
          return PersonWithFacesResponseDto.fromJson(value);
        case 'PlacesResponseDto':
          return PlacesResponseDto.fromJson(value);
        case 'PurchaseResponse':
          return PurchaseResponse.fromJson(value);
        case 'PurchaseUpdate':
          return PurchaseUpdate.fromJson(value);
        case 'QueueStatusDto':
          return QueueStatusDto.fromJson(value);
        case 'RandomSearchDto':
          return RandomSearchDto.fromJson(value);
        case 'RatingsResponse':
          return RatingsResponse.fromJson(value);
        case 'RatingsUpdate':
          return RatingsUpdate.fromJson(value);
        case 'ReactionLevel':
          return ReactionLevelTypeTransformer().decode(value);
        case 'ReactionType':
          return ReactionTypeTypeTransformer().decode(value);
        case 'ReverseGeocodingStateResponseDto':
          return ReverseGeocodingStateResponseDto.fromJson(value);
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
        case 'SearchSuggestionType':
          return SearchSuggestionTypeTypeTransformer().decode(value);
        case 'ServerAboutResponseDto':
          return ServerAboutResponseDto.fromJson(value);
        case 'ServerConfigDto':
          return ServerConfigDto.fromJson(value);
        case 'ServerFeaturesDto':
          return ServerFeaturesDto.fromJson(value);
        case 'ServerMediaTypesResponseDto':
          return ServerMediaTypesResponseDto.fromJson(value);
        case 'ServerPingResponse':
          return ServerPingResponse.fromJson(value);
        case 'ServerStatsResponseDto':
          return ServerStatsResponseDto.fromJson(value);
        case 'ServerStorageResponseDto':
          return ServerStorageResponseDto.fromJson(value);
        case 'ServerThemeDto':
          return ServerThemeDto.fromJson(value);
        case 'ServerVersionHistoryResponseDto':
          return ServerVersionHistoryResponseDto.fromJson(value);
        case 'ServerVersionResponseDto':
          return ServerVersionResponseDto.fromJson(value);
        case 'SessionResponseDto':
          return SessionResponseDto.fromJson(value);
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
        case 'SmartSearchDto':
          return SmartSearchDto.fromJson(value);
        case 'SourceType':
          return SourceTypeTypeTransformer().decode(value);
        case 'StackCreateDto':
          return StackCreateDto.fromJson(value);
        case 'StackResponseDto':
          return StackResponseDto.fromJson(value);
        case 'StackUpdateDto':
          return StackUpdateDto.fromJson(value);
        case 'SystemConfigDto':
          return SystemConfigDto.fromJson(value);
        case 'SystemConfigFFmpegDto':
          return SystemConfigFFmpegDto.fromJson(value);
        case 'SystemConfigFacesDto':
          return SystemConfigFacesDto.fromJson(value);
        case 'SystemConfigGeneratedImageDto':
          return SystemConfigGeneratedImageDto.fromJson(value);
        case 'SystemConfigImageDto':
          return SystemConfigImageDto.fromJson(value);
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
        case 'SystemConfigMetadataDto':
          return SystemConfigMetadataDto.fromJson(value);
        case 'SystemConfigNewVersionCheckDto':
          return SystemConfigNewVersionCheckDto.fromJson(value);
        case 'SystemConfigNotificationsDto':
          return SystemConfigNotificationsDto.fromJson(value);
        case 'SystemConfigOAuthDto':
          return SystemConfigOAuthDto.fromJson(value);
        case 'SystemConfigPasswordLoginDto':
          return SystemConfigPasswordLoginDto.fromJson(value);
        case 'SystemConfigReverseGeocodingDto':
          return SystemConfigReverseGeocodingDto.fromJson(value);
        case 'SystemConfigServerDto':
          return SystemConfigServerDto.fromJson(value);
        case 'SystemConfigSmtpDto':
          return SystemConfigSmtpDto.fromJson(value);
        case 'SystemConfigSmtpTransportDto':
          return SystemConfigSmtpTransportDto.fromJson(value);
        case 'SystemConfigStorageTemplateDto':
          return SystemConfigStorageTemplateDto.fromJson(value);
        case 'SystemConfigTemplateStorageOptionDto':
          return SystemConfigTemplateStorageOptionDto.fromJson(value);
        case 'SystemConfigThemeDto':
          return SystemConfigThemeDto.fromJson(value);
        case 'SystemConfigTrashDto':
          return SystemConfigTrashDto.fromJson(value);
        case 'SystemConfigUserDto':
          return SystemConfigUserDto.fromJson(value);
        case 'TagBulkAssetsDto':
          return TagBulkAssetsDto.fromJson(value);
        case 'TagBulkAssetsResponseDto':
          return TagBulkAssetsResponseDto.fromJson(value);
        case 'TagCreateDto':
          return TagCreateDto.fromJson(value);
        case 'TagResponseDto':
          return TagResponseDto.fromJson(value);
        case 'TagUpdateDto':
          return TagUpdateDto.fromJson(value);
        case 'TagUpsertDto':
          return TagUpsertDto.fromJson(value);
        case 'TagsResponse':
          return TagsResponse.fromJson(value);
        case 'TagsUpdate':
          return TagsUpdate.fromJson(value);
        case 'TestEmailResponseDto':
          return TestEmailResponseDto.fromJson(value);
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
        case 'TrashResponseDto':
          return TrashResponseDto.fromJson(value);
        case 'UpdateAlbumDto':
          return UpdateAlbumDto.fromJson(value);
        case 'UpdateAlbumUserDto':
          return UpdateAlbumUserDto.fromJson(value);
        case 'UpdateAssetDto':
          return UpdateAssetDto.fromJson(value);
        case 'UpdateLibraryDto':
          return UpdateLibraryDto.fromJson(value);
        case 'UpdatePartnerDto':
          return UpdatePartnerDto.fromJson(value);
        case 'UsageByUserDto':
          return UsageByUserDto.fromJson(value);
        case 'UserAdminCreateDto':
          return UserAdminCreateDto.fromJson(value);
        case 'UserAdminDeleteDto':
          return UserAdminDeleteDto.fromJson(value);
        case 'UserAdminResponseDto':
          return UserAdminResponseDto.fromJson(value);
        case 'UserAdminUpdateDto':
          return UserAdminUpdateDto.fromJson(value);
        case 'UserAvatarColor':
          return UserAvatarColorTypeTransformer().decode(value);
        case 'UserLicense':
          return UserLicense.fromJson(value);
        case 'UserPreferencesResponseDto':
          return UserPreferencesResponseDto.fromJson(value);
        case 'UserPreferencesUpdateDto':
          return UserPreferencesUpdateDto.fromJson(value);
        case 'UserResponseDto':
          return UserResponseDto.fromJson(value);
        case 'UserStatus':
          return UserStatusTypeTransformer().decode(value);
        case 'UserUpdateMeDto':
          return UserUpdateMeDto.fromJson(value);
        case 'ValidateAccessTokenResponseDto':
          return ValidateAccessTokenResponseDto.fromJson(value);
        case 'ValidateLibraryDto':
          return ValidateLibraryDto.fromJson(value);
        case 'ValidateLibraryImportPathResponseDto':
          return ValidateLibraryImportPathResponseDto.fromJson(value);
        case 'ValidateLibraryResponseDto':
          return ValidateLibraryResponseDto.fromJson(value);
        case 'VideoCodec':
          return VideoCodecTypeTransformer().decode(value);
        case 'VideoContainer':
          return VideoContainerTypeTransformer().decode(value);
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
