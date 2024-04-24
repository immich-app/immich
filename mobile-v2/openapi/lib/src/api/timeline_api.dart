//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/api_util.dart';
import 'package:openapi/src/model/asset_order.dart';
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:openapi/src/model/time_bucket_response_dto.dart';
import 'package:openapi/src/model/time_bucket_size.dart';

class TimelineApi {

  final Dio _dio;

  final Serializers _serializers;

  const TimelineApi(this._dio, this._serializers);

  /// getTimeBucket
  /// 
  ///
  /// Parameters:
  /// * [size] 
  /// * [timeBucket] 
  /// * [albumId] 
  /// * [isArchived] 
  /// * [isFavorite] 
  /// * [isTrashed] 
  /// * [key] 
  /// * [order] 
  /// * [personId] 
  /// * [userId] 
  /// * [withPartners] 
  /// * [withStacked] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [BuiltList<AssetResponseDto>] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<BuiltList<AssetResponseDto>>> getTimeBucket({ 
    required TimeBucketSize size,
    required String timeBucket,
    String? albumId,
    bool? isArchived,
    bool? isFavorite,
    bool? isTrashed,
    String? key,
    AssetOrder? order,
    String? personId,
    String? userId,
    bool? withPartners,
    bool? withStacked,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/timeline/bucket';
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'apiKey',
            'name': 'cookie',
            'keyName': 'immich_access_token',
            'where': '',
          },{
            'type': 'apiKey',
            'name': 'api_key',
            'keyName': 'x-api-key',
            'where': 'header',
          },{
            'type': 'http',
            'scheme': 'Bearer',
            'name': 'bearer',
          },
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      if (albumId != null) r'albumId': encodeQueryParameter(_serializers, albumId, const FullType(String)),
      if (isArchived != null) r'isArchived': encodeQueryParameter(_serializers, isArchived, const FullType(bool)),
      if (isFavorite != null) r'isFavorite': encodeQueryParameter(_serializers, isFavorite, const FullType(bool)),
      if (isTrashed != null) r'isTrashed': encodeQueryParameter(_serializers, isTrashed, const FullType(bool)),
      if (key != null) r'key': encodeQueryParameter(_serializers, key, const FullType(String)),
      if (order != null) r'order': encodeQueryParameter(_serializers, order, const FullType(AssetOrder)),
      if (personId != null) r'personId': encodeQueryParameter(_serializers, personId, const FullType(String)),
      r'size': encodeQueryParameter(_serializers, size, const FullType(TimeBucketSize)),
      r'timeBucket': encodeQueryParameter(_serializers, timeBucket, const FullType(String)),
      if (userId != null) r'userId': encodeQueryParameter(_serializers, userId, const FullType(String)),
      if (withPartners != null) r'withPartners': encodeQueryParameter(_serializers, withPartners, const FullType(bool)),
      if (withStacked != null) r'withStacked': encodeQueryParameter(_serializers, withStacked, const FullType(bool)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    BuiltList<AssetResponseDto>? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
      ) as BuiltList<AssetResponseDto>;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<BuiltList<AssetResponseDto>>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

  /// getTimeBuckets
  /// 
  ///
  /// Parameters:
  /// * [size] 
  /// * [albumId] 
  /// * [isArchived] 
  /// * [isFavorite] 
  /// * [isTrashed] 
  /// * [key] 
  /// * [order] 
  /// * [personId] 
  /// * [userId] 
  /// * [withPartners] 
  /// * [withStacked] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [BuiltList<TimeBucketResponseDto>] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<BuiltList<TimeBucketResponseDto>>> getTimeBuckets({ 
    required TimeBucketSize size,
    String? albumId,
    bool? isArchived,
    bool? isFavorite,
    bool? isTrashed,
    String? key,
    AssetOrder? order,
    String? personId,
    String? userId,
    bool? withPartners,
    bool? withStacked,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/timeline/buckets';
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'apiKey',
            'name': 'cookie',
            'keyName': 'immich_access_token',
            'where': '',
          },{
            'type': 'apiKey',
            'name': 'api_key',
            'keyName': 'x-api-key',
            'where': 'header',
          },{
            'type': 'http',
            'scheme': 'Bearer',
            'name': 'bearer',
          },
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      if (albumId != null) r'albumId': encodeQueryParameter(_serializers, albumId, const FullType(String)),
      if (isArchived != null) r'isArchived': encodeQueryParameter(_serializers, isArchived, const FullType(bool)),
      if (isFavorite != null) r'isFavorite': encodeQueryParameter(_serializers, isFavorite, const FullType(bool)),
      if (isTrashed != null) r'isTrashed': encodeQueryParameter(_serializers, isTrashed, const FullType(bool)),
      if (key != null) r'key': encodeQueryParameter(_serializers, key, const FullType(String)),
      if (order != null) r'order': encodeQueryParameter(_serializers, order, const FullType(AssetOrder)),
      if (personId != null) r'personId': encodeQueryParameter(_serializers, personId, const FullType(String)),
      r'size': encodeQueryParameter(_serializers, size, const FullType(TimeBucketSize)),
      if (userId != null) r'userId': encodeQueryParameter(_serializers, userId, const FullType(String)),
      if (withPartners != null) r'withPartners': encodeQueryParameter(_serializers, withPartners, const FullType(bool)),
      if (withStacked != null) r'withStacked': encodeQueryParameter(_serializers, withStacked, const FullType(bool)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    BuiltList<TimeBucketResponseDto>? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(BuiltList, [FullType(TimeBucketResponseDto)]),
      ) as BuiltList<TimeBucketResponseDto>;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<BuiltList<TimeBucketResponseDto>>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

}
