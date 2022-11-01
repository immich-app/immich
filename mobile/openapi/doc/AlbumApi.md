# openapi.api.AlbumApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**addAssetsToAlbum**](AlbumApi.md#addassetstoalbum) | **PUT** /album/{albumId}/assets | 
[**addUsersToAlbum**](AlbumApi.md#adduserstoalbum) | **PUT** /album/{albumId}/users | 
[**createAlbum**](AlbumApi.md#createalbum) | **POST** /album | 
[**deleteAlbum**](AlbumApi.md#deletealbum) | **DELETE** /album/{albumId} | 
[**downloadArchive**](AlbumApi.md#downloadarchive) | **GET** /album/{albumId}/download | 
[**getAlbumCountByUserId**](AlbumApi.md#getalbumcountbyuserid) | **GET** /album/count-by-user-id | 
[**getAlbumInfo**](AlbumApi.md#getalbuminfo) | **GET** /album/{albumId} | 
[**getAllAlbums**](AlbumApi.md#getallalbums) | **GET** /album | 
[**removeAssetFromAlbum**](AlbumApi.md#removeassetfromalbum) | **DELETE** /album/{albumId}/assets | 
[**removeUserFromAlbum**](AlbumApi.md#removeuserfromalbum) | **DELETE** /album/{albumId}/user/{userId} | 
[**updateAlbumInfo**](AlbumApi.md#updatealbuminfo) | **PATCH** /album/{albumId} | 


# **addAssetsToAlbum**
> AddAssetsResponseDto addAssetsToAlbum(albumId, addAssetsDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 
final addAssetsDto = AddAssetsDto(); // AddAssetsDto | 

try {
    final result = api_instance.addAssetsToAlbum(albumId, addAssetsDto);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->addAssetsToAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 
 **addAssetsDto** | [**AddAssetsDto**](AddAssetsDto.md)|  | 

### Return type

[**AddAssetsResponseDto**](AddAssetsResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addUsersToAlbum**
> AlbumResponseDto addUsersToAlbum(albumId, addUsersDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 
final addUsersDto = AddUsersDto(); // AddUsersDto | 

try {
    final result = api_instance.addUsersToAlbum(albumId, addUsersDto);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->addUsersToAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 
 **addUsersDto** | [**AddUsersDto**](AddUsersDto.md)|  | 

### Return type

[**AlbumResponseDto**](AlbumResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createAlbum**
> AlbumResponseDto createAlbum(createAlbumDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final createAlbumDto = CreateAlbumDto(); // CreateAlbumDto | 

try {
    final result = api_instance.createAlbum(createAlbumDto);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->createAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createAlbumDto** | [**CreateAlbumDto**](CreateAlbumDto.md)|  | 

### Return type

[**AlbumResponseDto**](AlbumResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteAlbum**
> deleteAlbum(albumId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 

try {
    api_instance.deleteAlbum(albumId);
} catch (e) {
    print('Exception when calling AlbumApi->deleteAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **downloadArchive**
> Object downloadArchive(albumId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 

try {
    final result = api_instance.downloadArchive(albumId);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->downloadArchive: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 

### Return type

[**Object**](Object.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAlbumCountByUserId**
> AlbumCountResponseDto getAlbumCountByUserId()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();

try {
    final result = api_instance.getAlbumCountByUserId();
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->getAlbumCountByUserId: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AlbumCountResponseDto**](AlbumCountResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAlbumInfo**
> AlbumResponseDto getAlbumInfo(albumId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 

try {
    final result = api_instance.getAlbumInfo(albumId);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->getAlbumInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 

### Return type

[**AlbumResponseDto**](AlbumResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllAlbums**
> List<AlbumResponseDto> getAllAlbums(shared, assetId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final shared = true; // bool | 
final assetId = assetId_example; // String | Only returns albums that contain the asset Ignores the shared parameter undefined: get all albums

try {
    final result = api_instance.getAllAlbums(shared, assetId);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->getAllAlbums: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **shared** | **bool**|  | [optional] 
 **assetId** | **String**| Only returns albums that contain the asset Ignores the shared parameter undefined: get all albums | [optional] 

### Return type

[**List<AlbumResponseDto>**](AlbumResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeAssetFromAlbum**
> AlbumResponseDto removeAssetFromAlbum(albumId, removeAssetsDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 
final removeAssetsDto = RemoveAssetsDto(); // RemoveAssetsDto | 

try {
    final result = api_instance.removeAssetFromAlbum(albumId, removeAssetsDto);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->removeAssetFromAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 
 **removeAssetsDto** | [**RemoveAssetsDto**](RemoveAssetsDto.md)|  | 

### Return type

[**AlbumResponseDto**](AlbumResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeUserFromAlbum**
> removeUserFromAlbum(albumId, userId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 
final userId = userId_example; // String | 

try {
    api_instance.removeUserFromAlbum(albumId, userId);
} catch (e) {
    print('Exception when calling AlbumApi->removeUserFromAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateAlbumInfo**
> AlbumResponseDto updateAlbumInfo(albumId, updateAlbumDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AlbumApi();
final albumId = albumId_example; // String | 
final updateAlbumDto = UpdateAlbumDto(); // UpdateAlbumDto | 

try {
    final result = api_instance.updateAlbumInfo(albumId, updateAlbumDto);
    print(result);
} catch (e) {
    print('Exception when calling AlbumApi->updateAlbumInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**|  | 
 **updateAlbumDto** | [**UpdateAlbumDto**](UpdateAlbumDto.md)|  | 

### Return type

[**AlbumResponseDto**](AlbumResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

