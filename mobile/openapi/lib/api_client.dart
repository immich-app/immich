// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// The HTTP transport + (de)serialization core shared by every `XxxApi` class.
///
/// [basePath] and [client] are mutable so the host app can repoint the client
/// at a different server or inject a custom (e.g. platform-native or mocked)
/// `http.Client` at runtime. JSON decoding runs on a background isolate via
/// [compute] to keep large payloads off the UI thread.
class ApiClient {
  ApiClient({this.basePath = '/api', this.authentication});

  /// Server base path; mutable so the app can switch endpoints at runtime.
  String basePath;

  final Authentication? authentication;

  var _client = Client();
  final _defaultHeaderMap = <String, String>{};

  /// The HTTP [Client] used for every request. Never null.
  Client get client => _client;

  /// Swaps in a new HTTP [Client] (e.g. a platform-native or mocked client).
  set client(Client newClient) {
    _client = newClient;
  }

  /// Headers applied to every request, in addition to per-call headers.
  Map<String, String> get defaultHeaderMap => _defaultHeaderMap;

  /// Registers a header sent with every subsequent request.
  void addDefaultHeader(String key, String value) {
    _defaultHeaderMap[key] = value;
  }

  /// Builds, authenticates, and sends a request, returning the full [Response].
  ///
  /// [queryParams] is a list (not a map) because a key may legitimately repeat
  /// under the `multi` collection format. [body] may be a JSON-encodable value,
  /// a [MultipartFile] (single-file upload), or a [MultipartRequest]. When
  /// [abortTrigger] completes the request is aborted with a
  /// [RequestAbortedException].
  Future<Response> invokeAPI(
    String path,
    String method,
    List<QueryParam> queryParams,
    Object? body,
    Map<String, String> headerParams,
    Map<String, String> formParams,
    String? contentType, {
    Future<void>? abortTrigger,
  }) async {
    await authentication?.applyToParams(queryParams, headerParams);

    headerParams.addAll(_defaultHeaderMap);
    if (contentType != null) {
      headerParams['Content-Type'] = contentType;
    }

    final urlEncodedQueryParams = queryParams.map((param) => '$param');
    final queryString = urlEncodedQueryParams.isNotEmpty ? '?${urlEncodedQueryParams.join('&')}' : '';
    final uri = Uri.parse('$basePath$path$queryString');

    try {
      // Single-file upload that is not itself a multipart/form-data body.
      if (body is MultipartFile &&
          (contentType == null || !contentType.toLowerCase().startsWith('multipart/form-data'))) {
        final request = AbortableStreamedRequest(method, uri, abortTrigger: abortTrigger);
        request.headers.addAll(headerParams);
        request.contentLength = body.length;
        body.finalize().listen(
          request.sink.add,
          onDone: request.sink.close,
          // ignore: avoid_types_on_closure_parameters
          onError: (Object error, StackTrace trace) => request.sink.close(),
          cancelOnError: true,
        );
        return Response.fromStream(await _client.send(request));
      }

      if (body is MultipartRequest) {
        final request = AbortableMultipartRequest(method, uri, abortTrigger: abortTrigger);
        request.fields.addAll(body.fields);
        request.files.addAll(body.files);
        request.headers.addAll(body.headers);
        request.headers.addAll(headerParams);
        return Response.fromStream(await _client.send(request));
      }

      final request = AbortableRequest(method, uri, abortTrigger: abortTrigger);
      request.headers.addAll(headerParams);
      if (contentType == 'application/x-www-form-urlencoded') {
        request.bodyFields = formParams;
      } else if (body != null) {
        request.body = await serializeAsync(body);
      }
      return Response.fromStream(await _client.send(request));
    } on RequestAbortedException {
      rethrow;
    } on SocketException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'Socket operation failed: $method $path', error, trace);
    } on TlsException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'TLS/SSL communication failed: $method $path', error, trace);
    } on IOException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'I/O operation failed: $method $path', error, trace);
    } on ClientException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'HTTP connection failed: $method $path', error, trace);
    } on Exception catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'Exception occurred: $method $path', error, trace);
    }
  }

  /// Decodes a JSON [value] into an instance of [targetType].
  ///
  /// JSON parsing runs on a background isolate via [compute] so large payloads
  /// do not block the UI thread.
  Future<dynamic> deserializeAsync(String value, String targetType, {bool growable = false}) async {
    // Decode off the main isolate; the type-dispatch below is cheap.
    if (targetType == 'String') {
      return value;
    }
    final decoded = await compute(_decodeJson, value);
    return fromJson(decoded, targetType, growable: growable);
  }

  /// JSON-encodes [value], returning `''` for `null`.
  Future<String> serializeAsync(Object? value) async => value == null ? '' : json.encode(value);

  /// Returns a native instance of the OpenAPI class named by [targetType].
  ///
  /// Scalars are coerced inline; `List<X>` / `Set<X>` / `Map<String, X>` recurse
  /// on their element type; everything else dispatches to the generated
  /// [deserializeNamed] table over all model and enum names.
  static dynamic fromJson(dynamic value, String targetType, {bool growable = false}) {
    final type = targetType.replaceAll(' ', '');
    try {
      switch (type) {
        case 'String':
          return value is String ? value : value.toString();
        case 'int':
          return value is int ? value : int.parse('$value');
        case 'double':
          return value is double ? value : double.parse('$value');
        case 'num':
          return value is num ? value : num.parse('$value');
        case 'bool':
          if (value is bool) {
            return value;
          }
          final valueString = '$value'.toLowerCase();
          return valueString == 'true' || valueString == '1';
        case 'DateTime':
          return value is DateTime ? value : DateTime.tryParse('$value');
        default:
          // Collection wrappers recurse on the element type.
          dynamic match;
          if (value is List && (match = _regList.firstMatch(type)?.group(1)) != null) {
            return value.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable)).toList(growable: growable);
          }
          if (value is Set && (match = _regSet.firstMatch(type)?.group(1)) != null) {
            return value.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable)).toSet();
          }
          if (value is Map && (match = _regMap.firstMatch(type)?.group(1)) != null) {
            return Map<String, dynamic>.fromIterables(
              value.keys.cast<String>(),
              value.values.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable)),
            );
          }
          // Named model / enum dispatch (generated; see deserializeNamed).
          final hit = deserializeNamed(value, type);
          if (hit != _noMatch) {
            return hit;
          }
      }
    } on Exception catch (error, trace) {
      throw ApiException.withInner(HttpStatus.internalServerError, 'Exception during deserialization.', error, trace);
    }
    throw ApiException(HttpStatus.internalServerError, 'Could not find a suitable class for deserialization');
  }
}

/// Decodes a JSON string; invoked inside [compute] on a background isolate.
dynamic _decodeJson(String value) => json.decode(value);

final _regList = RegExp(r'^List<(.*)>$');
final _regSet = RegExp(r'^Set<(.*)>$');
final _regMap = RegExp(r'^Map<String,(.*)>$');

/// Sentinel returned by [deserializeNamed] when [targetType] is not a known
/// model/enum name, so [ApiClient.fromJson] can fall through to its error path.
const Object _noMatch = Object();

// ───────────────────────────────────────────────────────────────────────────
// GENERATED DISPATCH — INJECTION POINT
//
// The integrator emits `deserializeNamed` as part of the generated client (a
// `part of openapi.api;` file). It must:
//   * `switch (targetType)` over EVERY model / enum / union / alias dartName;
//   * `return <Type>.fromJson(value);` for each case;
//   * `return _noMatch;` in the default branch (NOT throw) so collection and
//     error handling in `ApiClient.fromJson` stays centralized.
//
// Example body the generator should produce:
//
//   dynamic deserializeNamed(dynamic value, String targetType) {
//     switch (targetType) {
//       case 'ActivityCreateDto':
//         return ActivityCreateDto.fromJson(value);
//       // ... one case per declaration ...
//       default:
//         return _noMatch;
//     }
//   }
//
// TODO(integrator): replace this stub with the generated `deserializeNamed`.
// The stub below makes the runtime compile standalone; the generated version
// SHADOWS nothing — remove this stub when emitting the real one, or have the
// generator omit this stub file. It is kept here only so reviewers see the
// exact contract.
// ───────────────────────────────────────────────────────────────────────────
dynamic deserializeNamed(dynamic value, String targetType) {
  switch (targetType) {
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
      return AlbumUserRole.fromJson(value);
    case 'AlbumsAddAssetsDto':
      return AlbumsAddAssetsDto.fromJson(value);
    case 'AlbumsAddAssetsResponseDto':
      return AlbumsAddAssetsResponseDto.fromJson(value);
    case 'AlbumsResponse':
      return AlbumsResponse.fromJson(value);
    case 'AlbumsUpdate':
      return AlbumsUpdate.fromJson(value);
    case 'ApiKeyCreateDto':
      return ApiKeyCreateDto.fromJson(value);
    case 'ApiKeyCreateResponseDto':
      return ApiKeyCreateResponseDto.fromJson(value);
    case 'ApiKeyResponseDto':
      return ApiKeyResponseDto.fromJson(value);
    case 'ApiKeyUpdateDto':
      return ApiKeyUpdateDto.fromJson(value);
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
    case 'AssetCopyDto':
      return AssetCopyDto.fromJson(value);
    case 'AssetEditAction':
      return AssetEditAction.fromJson(value);
    case 'AssetEditActionItemDto':
      return AssetEditActionItemDto.fromJson(value);
    case 'AssetEditActionItemResponseDto':
      return AssetEditActionItemResponseDto.fromJson(value);
    case 'AssetEditsCreateDto':
      return AssetEditsCreateDto.fromJson(value);
    case 'AssetEditsResponseDto':
      return AssetEditsResponseDto.fromJson(value);
    case 'AssetFaceCreateDto':
      return AssetFaceCreateDto.fromJson(value);
    case 'AssetFaceDeleteDto':
      return AssetFaceDeleteDto.fromJson(value);
    case 'AssetFaceResponseDto':
      return AssetFaceResponseDto.fromJson(value);
    case 'AssetFaceUpdateDto':
      return AssetFaceUpdateDto.fromJson(value);
    case 'AssetFaceUpdateItem':
      return AssetFaceUpdateItem.fromJson(value);
    case 'AssetIdErrorReason':
      return AssetIdErrorReason.fromJson(value);
    case 'AssetIdsDto':
      return AssetIdsDto.fromJson(value);
    case 'AssetIdsResponseDto':
      return AssetIdsResponseDto.fromJson(value);
    case 'AssetJobName':
      return AssetJobName.fromJson(value);
    case 'AssetJobsDto':
      return AssetJobsDto.fromJson(value);
    case 'AssetMediaCreateDto':
      return AssetMediaCreateDto.fromJson(value);
    case 'AssetMediaResponseDto':
      return AssetMediaResponseDto.fromJson(value);
    case 'AssetMediaSize':
      return AssetMediaSize.fromJson(value);
    case 'AssetMediaStatus':
      return AssetMediaStatus.fromJson(value);
    case 'AssetMetadataBulkDeleteDto':
      return AssetMetadataBulkDeleteDto.fromJson(value);
    case 'AssetMetadataBulkDeleteItemDto':
      return AssetMetadataBulkDeleteItemDto.fromJson(value);
    case 'AssetMetadataBulkResponseDto':
      return AssetMetadataBulkResponseDto.fromJson(value);
    case 'AssetMetadataBulkUpsertDto':
      return AssetMetadataBulkUpsertDto.fromJson(value);
    case 'AssetMetadataBulkUpsertItemDto':
      return AssetMetadataBulkUpsertItemDto.fromJson(value);
    case 'AssetMetadataResponseDto':
      return AssetMetadataResponseDto.fromJson(value);
    case 'AssetMetadataUpsertDto':
      return AssetMetadataUpsertDto.fromJson(value);
    case 'AssetMetadataUpsertItemDto':
      return AssetMetadataUpsertItemDto.fromJson(value);
    case 'AssetOcrResponseDto':
      return AssetOcrResponseDto.fromJson(value);
    case 'AssetOrder':
      return AssetOrder.fromJson(value);
    case 'AssetOrderBy':
      return AssetOrderBy.fromJson(value);
    case 'AssetRejectReason':
      return AssetRejectReason.fromJson(value);
    case 'AssetResponseDto':
      return AssetResponseDto.fromJson(value);
    case 'AssetStackResponseDto':
      return AssetStackResponseDto.fromJson(value);
    case 'AssetStatsResponseDto':
      return AssetStatsResponseDto.fromJson(value);
    case 'AssetTypeEnum':
      return AssetTypeEnum.fromJson(value);
    case 'AssetUploadAction':
      return AssetUploadAction.fromJson(value);
    case 'AssetVisibility':
      return AssetVisibility.fromJson(value);
    case 'AudioCodec':
      return AudioCodec.fromJson(value);
    case 'AuthStatusResponseDto':
      return AuthStatusResponseDto.fromJson(value);
    case 'AvatarUpdate':
      return AvatarUpdate.fromJson(value);
    case 'BulkIdErrorReason':
      return BulkIdErrorReason.fromJson(value);
    case 'BulkIdResponseDto':
      return BulkIdResponseDto.fromJson(value);
    case 'BulkIdsDto':
      return BulkIdsDto.fromJson(value);
    case 'CastResponse':
      return CastResponse.fromJson(value);
    case 'CastUpdate':
      return CastUpdate.fromJson(value);
    case 'ChangePasswordDto':
      return ChangePasswordDto.fromJson(value);
    case 'ClipConfig':
      return ClipConfig.fromJson(value);
    case 'Colorspace':
      return Colorspace.fromJson(value);
    case 'ContributorCountResponseDto':
      return ContributorCountResponseDto.fromJson(value);
    case 'CqMode':
      return CqMode.fromJson(value);
    case 'CreateAlbumDto':
      return CreateAlbumDto.fromJson(value);
    case 'CreateLibraryDto':
      return CreateLibraryDto.fromJson(value);
    case 'CreateProfileImageDto':
      return CreateProfileImageDto.fromJson(value);
    case 'CreateProfileImageResponseDto':
      return CreateProfileImageResponseDto.fromJson(value);
    case 'CropParameters':
      return CropParameters.fromJson(value);
    case 'DatabaseBackupConfig':
      return DatabaseBackupConfig.fromJson(value);
    case 'DatabaseBackupDeleteDto':
      return DatabaseBackupDeleteDto.fromJson(value);
    case 'DatabaseBackupDto':
      return DatabaseBackupDto.fromJson(value);
    case 'DatabaseBackupListResponseDto':
      return DatabaseBackupListResponseDto.fromJson(value);
    case 'DatabaseBackupUploadDto':
      return DatabaseBackupUploadDto.fromJson(value);
    case 'DownloadArchiveDto':
      return DownloadArchiveDto.fromJson(value);
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
    case 'DuplicateResolveDto':
      return DuplicateResolveDto.fromJson(value);
    case 'DuplicateResolveGroupDto':
      return DuplicateResolveGroupDto.fromJson(value);
    case 'DuplicateResponseDto':
      return DuplicateResponseDto.fromJson(value);
    case 'EmailNotificationsResponse':
      return EmailNotificationsResponse.fromJson(value);
    case 'EmailNotificationsUpdate':
      return EmailNotificationsUpdate.fromJson(value);
    case 'ExifResponseDto':
      return ExifResponseDto.fromJson(value);
    case 'FaceDto':
      return FaceDto.fromJson(value);
    case 'FacialRecognitionConfig':
      return FacialRecognitionConfig.fromJson(value);
    case 'FoldersResponse':
      return FoldersResponse.fromJson(value);
    case 'FoldersUpdate':
      return FoldersUpdate.fromJson(value);
    case 'ImageFormat':
      return ImageFormat.fromJson(value);
    case 'JobCreateDto':
      return JobCreateDto.fromJson(value);
    case 'JobName':
      return JobName.fromJson(value);
    case 'JobSettingsDto':
      return JobSettingsDto.fromJson(value);
    case 'LibraryResponseDto':
      return LibraryResponseDto.fromJson(value);
    case 'LibraryStatsResponseDto':
      return LibraryStatsResponseDto.fromJson(value);
    case 'LicenseKeyDto':
      return LicenseKeyDto.fromJson(value);
    case 'LogLevel':
      return LogLevel.fromJson(value);
    case 'LoginCredentialDto':
      return LoginCredentialDto.fromJson(value);
    case 'LoginResponseDto':
      return LoginResponseDto.fromJson(value);
    case 'LogoutResponseDto':
      return LogoutResponseDto.fromJson(value);
    case 'MachineLearningAvailabilityChecksDto':
      return MachineLearningAvailabilityChecksDto.fromJson(value);
    case 'MaintenanceAction':
      return MaintenanceAction.fromJson(value);
    case 'MaintenanceAuthDto':
      return MaintenanceAuthDto.fromJson(value);
    case 'MaintenanceDetectInstallResponseDto':
      return MaintenanceDetectInstallResponseDto.fromJson(value);
    case 'MaintenanceDetectInstallStorageFolderDto':
      return MaintenanceDetectInstallStorageFolderDto.fromJson(value);
    case 'MaintenanceLoginDto':
      return MaintenanceLoginDto.fromJson(value);
    case 'MaintenanceStatusResponseDto':
      return MaintenanceStatusResponseDto.fromJson(value);
    case 'ManualJobName':
      return ManualJobName.fromJson(value);
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
    case 'MemoryResponseDto':
      return MemoryResponseDto.fromJson(value);
    case 'MemorySearchOrder':
      return MemorySearchOrder.fromJson(value);
    case 'MemoryStatisticsResponseDto':
      return MemoryStatisticsResponseDto.fromJson(value);
    case 'MemoryType':
      return MemoryType.fromJson(value);
    case 'MemoryUpdateDto':
      return MemoryUpdateDto.fromJson(value);
    case 'MergePersonDto':
      return MergePersonDto.fromJson(value);
    case 'MetadataSearchDto':
      return MetadataSearchDto.fromJson(value);
    case 'MirrorAxis':
      return MirrorAxis.fromJson(value);
    case 'MirrorParameters':
      return MirrorParameters.fromJson(value);
    case 'NotificationCreateDto':
      return NotificationCreateDto.fromJson(value);
    case 'NotificationDeleteAllDto':
      return NotificationDeleteAllDto.fromJson(value);
    case 'NotificationDto':
      return NotificationDto.fromJson(value);
    case 'NotificationLevel':
      return NotificationLevel.fromJson(value);
    case 'NotificationType':
      return NotificationType.fromJson(value);
    case 'NotificationUpdateAllDto':
      return NotificationUpdateAllDto.fromJson(value);
    case 'NotificationUpdateDto':
      return NotificationUpdateDto.fromJson(value);
    case 'OAuthAuthorizeResponseDto':
      return OAuthAuthorizeResponseDto.fromJson(value);
    case 'OAuthBackchannelLogoutDto':
      return OAuthBackchannelLogoutDto.fromJson(value);
    case 'OAuthCallbackDto':
      return OAuthCallbackDto.fromJson(value);
    case 'OAuthConfigDto':
      return OAuthConfigDto.fromJson(value);
    case 'OAuthTokenEndpointAuthMethod':
      return OAuthTokenEndpointAuthMethod.fromJson(value);
    case 'OcrConfig':
      return OcrConfig.fromJson(value);
    case 'OnThisDayDto':
      return OnThisDayDto.fromJson(value);
    case 'OnboardingDto':
      return OnboardingDto.fromJson(value);
    case 'OnboardingResponseDto':
      return OnboardingResponseDto.fromJson(value);
    case 'PartnerCreateDto':
      return PartnerCreateDto.fromJson(value);
    case 'PartnerDirection':
      return PartnerDirection.fromJson(value);
    case 'PartnerResponseDto':
      return PartnerResponseDto.fromJson(value);
    case 'PartnerUpdateDto':
      return PartnerUpdateDto.fromJson(value);
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
      return Permission.fromJson(value);
    case 'PersonCreateDto':
      return PersonCreateDto.fromJson(value);
    case 'PersonResponseDto':
      return PersonResponseDto.fromJson(value);
    case 'PersonStatisticsResponseDto':
      return PersonStatisticsResponseDto.fromJson(value);
    case 'PersonUpdateDto':
      return PersonUpdateDto.fromJson(value);
    case 'PinCodeChangeDto':
      return PinCodeChangeDto.fromJson(value);
    case 'PinCodeResetDto':
      return PinCodeResetDto.fromJson(value);
    case 'PinCodeSetupDto':
      return PinCodeSetupDto.fromJson(value);
    case 'PlacesResponseDto':
      return PlacesResponseDto.fromJson(value);
    case 'PluginMethodResponseDto':
      return PluginMethodResponseDto.fromJson(value);
    case 'PluginResponseDto':
      return PluginResponseDto.fromJson(value);
    case 'PluginTemplateResponseDto':
      return PluginTemplateResponseDto.fromJson(value);
    case 'PluginTemplateStepResponseDto':
      return PluginTemplateStepResponseDto.fromJson(value);
    case 'PurchaseResponse':
      return PurchaseResponse.fromJson(value);
    case 'PurchaseUpdate':
      return PurchaseUpdate.fromJson(value);
    case 'QueueCommand':
      return QueueCommand.fromJson(value);
    case 'QueueCommandDto':
      return QueueCommandDto.fromJson(value);
    case 'QueueDeleteDto':
      return QueueDeleteDto.fromJson(value);
    case 'QueueJobResponseDto':
      return QueueJobResponseDto.fromJson(value);
    case 'QueueJobStatus':
      return QueueJobStatus.fromJson(value);
    case 'QueueName':
      return QueueName.fromJson(value);
    case 'QueueResponseDto':
      return QueueResponseDto.fromJson(value);
    case 'QueueResponseLegacyDto':
      return QueueResponseLegacyDto.fromJson(value);
    case 'QueueStatisticsDto':
      return QueueStatisticsDto.fromJson(value);
    case 'QueueStatusLegacyDto':
      return QueueStatusLegacyDto.fromJson(value);
    case 'QueueUpdateDto':
      return QueueUpdateDto.fromJson(value);
    case 'QueuesResponseLegacyDto':
      return QueuesResponseLegacyDto.fromJson(value);
    case 'RandomSearchDto':
      return RandomSearchDto.fromJson(value);
    case 'RatingsResponse':
      return RatingsResponse.fromJson(value);
    case 'RatingsUpdate':
      return RatingsUpdate.fromJson(value);
    case 'ReactionLevel':
      return ReactionLevel.fromJson(value);
    case 'ReactionType':
      return ReactionType.fromJson(value);
    case 'ReverseGeocodingStateResponseDto':
      return ReverseGeocodingStateResponseDto.fromJson(value);
    case 'RotateParameters':
      return RotateParameters.fromJson(value);
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
    case 'SearchStatisticsResponseDto':
      return SearchStatisticsResponseDto.fromJson(value);
    case 'SearchSuggestionType':
      return SearchSuggestionType.fromJson(value);
    case 'ServerAboutResponseDto':
      return ServerAboutResponseDto.fromJson(value);
    case 'ServerApkLinksDto':
      return ServerApkLinksDto.fromJson(value);
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
    case 'ServerVersionHistoryResponseDto':
      return ServerVersionHistoryResponseDto.fromJson(value);
    case 'ServerVersionResponseDto':
      return ServerVersionResponseDto.fromJson(value);
    case 'SessionCreateDto':
      return SessionCreateDto.fromJson(value);
    case 'SessionCreateResponseDto':
      return SessionCreateResponseDto.fromJson(value);
    case 'SessionResponseDto':
      return SessionResponseDto.fromJson(value);
    case 'SessionUnlockDto':
      return SessionUnlockDto.fromJson(value);
    case 'SessionUpdateDto':
      return SessionUpdateDto.fromJson(value);
    case 'SetMaintenanceModeDto':
      return SetMaintenanceModeDto.fromJson(value);
    case 'SharedLinkCreateDto':
      return SharedLinkCreateDto.fromJson(value);
    case 'SharedLinkEditDto':
      return SharedLinkEditDto.fromJson(value);
    case 'SharedLinkLoginDto':
      return SharedLinkLoginDto.fromJson(value);
    case 'SharedLinkResponseDto':
      return SharedLinkResponseDto.fromJson(value);
    case 'SharedLinkType':
      return SharedLinkType.fromJson(value);
    case 'SharedLinksResponse':
      return SharedLinksResponse.fromJson(value);
    case 'SharedLinksUpdate':
      return SharedLinksUpdate.fromJson(value);
    case 'SignUpDto':
      return SignUpDto.fromJson(value);
    case 'SmartSearchDto':
      return SmartSearchDto.fromJson(value);
    case 'SourceType':
      return SourceType.fromJson(value);
    case 'StackCreateDto':
      return StackCreateDto.fromJson(value);
    case 'StackResponseDto':
      return StackResponseDto.fromJson(value);
    case 'StackUpdateDto':
      return StackUpdateDto.fromJson(value);
    case 'StatisticsSearchDto':
      return StatisticsSearchDto.fromJson(value);
    case 'StorageFolder':
      return StorageFolder.fromJson(value);
    case 'SyncAckDeleteDto':
      return SyncAckDeleteDto.fromJson(value);
    case 'SyncAckDto':
      return SyncAckDto.fromJson(value);
    case 'SyncAckSetDto':
      return SyncAckSetDto.fromJson(value);
    case 'SyncAckV1':
      return SyncAckV1.fromJson(value);
    case 'SyncAlbumDeleteV1':
      return SyncAlbumDeleteV1.fromJson(value);
    case 'SyncAlbumToAssetDeleteV1':
      return SyncAlbumToAssetDeleteV1.fromJson(value);
    case 'SyncAlbumToAssetV1':
      return SyncAlbumToAssetV1.fromJson(value);
    case 'SyncAlbumUserDeleteV1':
      return SyncAlbumUserDeleteV1.fromJson(value);
    case 'SyncAlbumUserV1':
      return SyncAlbumUserV1.fromJson(value);
    case 'SyncAlbumV1':
      return SyncAlbumV1.fromJson(value);
    case 'SyncAlbumV2':
      return SyncAlbumV2.fromJson(value);
    case 'SyncAssetDeleteV1':
      return SyncAssetDeleteV1.fromJson(value);
    case 'SyncAssetEditDeleteV1':
      return SyncAssetEditDeleteV1.fromJson(value);
    case 'SyncAssetEditV1':
      return SyncAssetEditV1.fromJson(value);
    case 'SyncAssetExifV1':
      return SyncAssetExifV1.fromJson(value);
    case 'SyncAssetFaceDeleteV1':
      return SyncAssetFaceDeleteV1.fromJson(value);
    case 'SyncAssetFaceV1':
      return SyncAssetFaceV1.fromJson(value);
    case 'SyncAssetFaceV2':
      return SyncAssetFaceV2.fromJson(value);
    case 'SyncAssetMetadataDeleteV1':
      return SyncAssetMetadataDeleteV1.fromJson(value);
    case 'SyncAssetMetadataV1':
      return SyncAssetMetadataV1.fromJson(value);
    case 'SyncAssetV1':
      return SyncAssetV1.fromJson(value);
    case 'SyncAssetV2':
      return SyncAssetV2.fromJson(value);
    case 'SyncAuthUserV1':
      return SyncAuthUserV1.fromJson(value);
    case 'SyncCompleteV1':
      return SyncCompleteV1.fromJson(value);
    case 'SyncEntityType':
      return SyncEntityType.fromJson(value);
    case 'SyncMemoryAssetDeleteV1':
      return SyncMemoryAssetDeleteV1.fromJson(value);
    case 'SyncMemoryAssetV1':
      return SyncMemoryAssetV1.fromJson(value);
    case 'SyncMemoryDeleteV1':
      return SyncMemoryDeleteV1.fromJson(value);
    case 'SyncMemoryV1':
      return SyncMemoryV1.fromJson(value);
    case 'SyncPartnerDeleteV1':
      return SyncPartnerDeleteV1.fromJson(value);
    case 'SyncPartnerV1':
      return SyncPartnerV1.fromJson(value);
    case 'SyncPersonDeleteV1':
      return SyncPersonDeleteV1.fromJson(value);
    case 'SyncPersonV1':
      return SyncPersonV1.fromJson(value);
    case 'SyncRequestType':
      return SyncRequestType.fromJson(value);
    case 'SyncResetV1':
      return SyncResetV1.fromJson(value);
    case 'SyncStackDeleteV1':
      return SyncStackDeleteV1.fromJson(value);
    case 'SyncStackV1':
      return SyncStackV1.fromJson(value);
    case 'SyncStreamDto':
      return SyncStreamDto.fromJson(value);
    case 'SyncUserDeleteV1':
      return SyncUserDeleteV1.fromJson(value);
    case 'SyncUserMetadataDeleteV1':
      return SyncUserMetadataDeleteV1.fromJson(value);
    case 'SyncUserMetadataV1':
      return SyncUserMetadataV1.fromJson(value);
    case 'SyncUserV1':
      return SyncUserV1.fromJson(value);
    case 'SystemConfigBackupsDto':
      return SystemConfigBackupsDto.fromJson(value);
    case 'SystemConfigDto':
      return SystemConfigDto.fromJson(value);
    case 'SystemConfigFFmpegDto':
      return SystemConfigFFmpegDto.fromJson(value);
    case 'SystemConfigFacesDto':
      return SystemConfigFacesDto.fromJson(value);
    case 'SystemConfigGeneratedFullsizeImageDto':
      return SystemConfigGeneratedFullsizeImageDto.fromJson(value);
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
    case 'SystemConfigNightlyTasksDto':
      return SystemConfigNightlyTasksDto.fromJson(value);
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
    case 'SystemConfigTemplateEmailsDto':
      return SystemConfigTemplateEmailsDto.fromJson(value);
    case 'SystemConfigTemplateStorageOptionDto':
      return SystemConfigTemplateStorageOptionDto.fromJson(value);
    case 'SystemConfigTemplatesDto':
      return SystemConfigTemplatesDto.fromJson(value);
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
    case 'TemplateDto':
      return TemplateDto.fromJson(value);
    case 'TemplateResponseDto':
      return TemplateResponseDto.fromJson(value);
    case 'TestEmailResponseDto':
      return TestEmailResponseDto.fromJson(value);
    case 'TimeBucketAssetResponseDto':
      return TimeBucketAssetResponseDto.fromJson(value);
    case 'TimeBucketsResponseDto':
      return TimeBucketsResponseDto.fromJson(value);
    case 'ToneMapping':
      return ToneMapping.fromJson(value);
    case 'TranscodeHwAccel':
      return TranscodeHwAccel.fromJson(value);
    case 'TranscodePolicy':
      return TranscodePolicy.fromJson(value);
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
      return UserAvatarColor.fromJson(value);
    case 'UserLicense':
      return UserLicense.fromJson(value);
    case 'UserMetadataKey':
      return UserMetadataKey.fromJson(value);
    case 'UserPreferencesResponseDto':
      return UserPreferencesResponseDto.fromJson(value);
    case 'UserPreferencesUpdateDto':
      return UserPreferencesUpdateDto.fromJson(value);
    case 'UserResponseDto':
      return UserResponseDto.fromJson(value);
    case 'UserStatus':
      return UserStatus.fromJson(value);
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
    case 'VersionCheckStateResponseDto':
      return VersionCheckStateResponseDto.fromJson(value);
    case 'VideoCodec':
      return VideoCodec.fromJson(value);
    case 'VideoContainer':
      return VideoContainer.fromJson(value);
    case 'WorkflowCreateDto':
      return WorkflowCreateDto.fromJson(value);
    case 'WorkflowResponseDto':
      return WorkflowResponseDto.fromJson(value);
    case 'WorkflowShareResponseDto':
      return WorkflowShareResponseDto.fromJson(value);
    case 'WorkflowShareStepDto':
      return WorkflowShareStepDto.fromJson(value);
    case 'WorkflowStepDto':
      return WorkflowStepDto.fromJson(value);
    case 'WorkflowTrigger':
      return WorkflowTrigger.fromJson(value);
    case 'WorkflowTriggerResponseDto':
      return WorkflowTriggerResponseDto.fromJson(value);
    case 'WorkflowType':
      return WorkflowType.fromJson(value);
    case 'WorkflowUpdateDto':
      return WorkflowUpdateDto.fromJson(value);
    default:
      return _noMatch;
  }
}
