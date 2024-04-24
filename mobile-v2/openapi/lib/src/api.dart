//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:dio/dio.dart';
import 'package:built_value/serializer.dart';
import 'package:openapi/src/serializers.dart';
import 'package:openapi/src/auth/api_key_auth.dart';
import 'package:openapi/src/auth/basic_auth.dart';
import 'package:openapi/src/auth/bearer_auth.dart';
import 'package:openapi/src/auth/oauth.dart';
import 'package:openapi/src/api/api_key_api.dart';
import 'package:openapi/src/api/activity_api.dart';
import 'package:openapi/src/api/album_api.dart';
import 'package:openapi/src/api/asset_api.dart';
import 'package:openapi/src/api/audit_api.dart';
import 'package:openapi/src/api/authentication_api.dart';
import 'package:openapi/src/api/download_api.dart';
import 'package:openapi/src/api/face_api.dart';
import 'package:openapi/src/api/file_report_api.dart';
import 'package:openapi/src/api/job_api.dart';
import 'package:openapi/src/api/library_api.dart';
import 'package:openapi/src/api/memory_api.dart';
import 'package:openapi/src/api/o_auth_api.dart';
import 'package:openapi/src/api/partner_api.dart';
import 'package:openapi/src/api/person_api.dart';
import 'package:openapi/src/api/search_api.dart';
import 'package:openapi/src/api/server_info_api.dart';
import 'package:openapi/src/api/sessions_api.dart';
import 'package:openapi/src/api/shared_link_api.dart';
import 'package:openapi/src/api/sync_api.dart';
import 'package:openapi/src/api/system_config_api.dart';
import 'package:openapi/src/api/system_metadata_api.dart';
import 'package:openapi/src/api/tag_api.dart';
import 'package:openapi/src/api/timeline_api.dart';
import 'package:openapi/src/api/trash_api.dart';
import 'package:openapi/src/api/user_api.dart';

class Openapi {
  static const String basePath = r'/api';

  final Dio dio;
  final Serializers serializers;

  Openapi({
    Dio? dio,
    Serializers? serializers,
    String? basePathOverride,
    List<Interceptor>? interceptors,
  })  : this.serializers = serializers ?? standardSerializers,
        this.dio = dio ??
            Dio(BaseOptions(
              baseUrl: basePathOverride ?? basePath,
              connectTimeout: const Duration(milliseconds: 5000),
              receiveTimeout: const Duration(milliseconds: 3000),
            )) {
    if (interceptors == null) {
      this.dio.interceptors.addAll([
        OAuthInterceptor(),
        BasicAuthInterceptor(),
        BearerAuthInterceptor(),
        ApiKeyAuthInterceptor(),
      ]);
    } else {
      this.dio.interceptors.addAll(interceptors);
    }
  }

  void setOAuthToken(String name, String token) {
    if (this.dio.interceptors.any((i) => i is OAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is OAuthInterceptor) as OAuthInterceptor).tokens[name] = token;
    }
  }

  void setBearerAuth(String name, String token) {
    if (this.dio.interceptors.any((i) => i is BearerAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BearerAuthInterceptor) as BearerAuthInterceptor).tokens[name] = token;
    }
  }

  void setBasicAuth(String name, String username, String password) {
    if (this.dio.interceptors.any((i) => i is BasicAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BasicAuthInterceptor) as BasicAuthInterceptor).authInfo[name] = BasicAuthInfo(username, password);
    }
  }

  void setApiKey(String name, String apiKey) {
    if (this.dio.interceptors.any((i) => i is ApiKeyAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((element) => element is ApiKeyAuthInterceptor) as ApiKeyAuthInterceptor).apiKeys[name] = apiKey;
    }
  }

  /// Get APIKeyApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  APIKeyApi getAPIKeyApi() {
    return APIKeyApi(dio, serializers);
  }

  /// Get ActivityApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ActivityApi getActivityApi() {
    return ActivityApi(dio, serializers);
  }

  /// Get AlbumApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AlbumApi getAlbumApi() {
    return AlbumApi(dio, serializers);
  }

  /// Get AssetApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AssetApi getAssetApi() {
    return AssetApi(dio, serializers);
  }

  /// Get AuditApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AuditApi getAuditApi() {
    return AuditApi(dio, serializers);
  }

  /// Get AuthenticationApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AuthenticationApi getAuthenticationApi() {
    return AuthenticationApi(dio, serializers);
  }

  /// Get DownloadApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  DownloadApi getDownloadApi() {
    return DownloadApi(dio, serializers);
  }

  /// Get FaceApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  FaceApi getFaceApi() {
    return FaceApi(dio, serializers);
  }

  /// Get FileReportApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  FileReportApi getFileReportApi() {
    return FileReportApi(dio, serializers);
  }

  /// Get JobApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  JobApi getJobApi() {
    return JobApi(dio, serializers);
  }

  /// Get LibraryApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  LibraryApi getLibraryApi() {
    return LibraryApi(dio, serializers);
  }

  /// Get MemoryApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  MemoryApi getMemoryApi() {
    return MemoryApi(dio, serializers);
  }

  /// Get OAuthApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  OAuthApi getOAuthApi() {
    return OAuthApi(dio, serializers);
  }

  /// Get PartnerApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  PartnerApi getPartnerApi() {
    return PartnerApi(dio, serializers);
  }

  /// Get PersonApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  PersonApi getPersonApi() {
    return PersonApi(dio, serializers);
  }

  /// Get SearchApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SearchApi getSearchApi() {
    return SearchApi(dio, serializers);
  }

  /// Get ServerInfoApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ServerInfoApi getServerInfoApi() {
    return ServerInfoApi(dio, serializers);
  }

  /// Get SessionsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SessionsApi getSessionsApi() {
    return SessionsApi(dio, serializers);
  }

  /// Get SharedLinkApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SharedLinkApi getSharedLinkApi() {
    return SharedLinkApi(dio, serializers);
  }

  /// Get SyncApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SyncApi getSyncApi() {
    return SyncApi(dio, serializers);
  }

  /// Get SystemConfigApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SystemConfigApi getSystemConfigApi() {
    return SystemConfigApi(dio, serializers);
  }

  /// Get SystemMetadataApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SystemMetadataApi getSystemMetadataApi() {
    return SystemMetadataApi(dio, serializers);
  }

  /// Get TagApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  TagApi getTagApi() {
    return TagApi(dio, serializers);
  }

  /// Get TimelineApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  TimelineApi getTimelineApi() {
    return TimelineApi(dio, serializers);
  }

  /// Get TrashApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  TrashApi getTrashApi() {
    return TrashApi(dio, serializers);
  }

  /// Get UserApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  UserApi getUserApi() {
    return UserApi(dio, serializers);
  }
}
