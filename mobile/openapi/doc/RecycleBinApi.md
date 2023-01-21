# openapi.api.RecycleBinApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteRecyleBinAssets**](RecycleBinApi.md#deleterecylebinassets) | **DELETE** /bin/assets | 
[**emptyBin**](RecycleBinApi.md#emptybin) | **DELETE** /bin | 
[**getAllDeletedAssets**](RecycleBinApi.md#getalldeletedassets) | **GET** /bin | 
[**getRecycleBinConfig**](RecycleBinApi.md#getrecyclebinconfig) | **GET** /bin/config | 
[**getRecycleBinCountByUserId**](RecycleBinApi.md#getrecyclebincountbyuserid) | **GET** /bin/count-by-user-id | 
[**restoreDeletedAssets**](RecycleBinApi.md#restoredeletedassets) | **PUT** /bin/assets | 


# **deleteRecyleBinAssets**
> List<DeleteAssetResponseDto> deleteRecyleBinAssets(deleteAssetDto)



Permenantly delete Assets

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = RecycleBinApi();
final deleteAssetDto = DeleteAssetDto(); // DeleteAssetDto | 

try {
    final result = api_instance.deleteRecyleBinAssets(deleteAssetDto);
    print(result);
} catch (e) {
    print('Exception when calling RecycleBinApi->deleteRecyleBinAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deleteAssetDto** | [**DeleteAssetDto**](DeleteAssetDto.md)|  | 

### Return type

[**List<DeleteAssetResponseDto>**](DeleteAssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **emptyBin**
> List<DeleteAssetResponseDto> emptyBin()



Empty out bin for User

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = RecycleBinApi();

try {
    final result = api_instance.emptyBin();
    print(result);
} catch (e) {
    print('Exception when calling RecycleBinApi->emptyBin: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<DeleteAssetResponseDto>**](DeleteAssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllDeletedAssets**
> List<AssetResponseDto> getAllDeletedAssets()



Get all AssetEntity deleted by user

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = RecycleBinApi();

try {
    final result = api_instance.getAllDeletedAssets();
    print(result);
} catch (e) {
    print('Exception when calling RecycleBinApi->getAllDeletedAssets: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRecycleBinConfig**
> RecycleBinConfigResponseDto getRecycleBinConfig()





### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = RecycleBinApi();

try {
    final result = api_instance.getRecycleBinConfig();
    print(result);
} catch (e) {
    print('Exception when calling RecycleBinApi->getRecycleBinConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**RecycleBinConfigResponseDto**](RecycleBinConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRecycleBinCountByUserId**
> AssetCountByUserIdResponseDto getRecycleBinCountByUserId()





### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = RecycleBinApi();

try {
    final result = api_instance.getRecycleBinCountByUserId();
    print(result);
} catch (e) {
    print('Exception when calling RecycleBinApi->getRecycleBinCountByUserId: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AssetCountByUserIdResponseDto**](AssetCountByUserIdResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **restoreDeletedAssets**
> List<AssetResponseDto> restoreDeletedAssets(restoreAssetsDto)



Restore deleted Assets by User

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = RecycleBinApi();
final restoreAssetsDto = RestoreAssetsDto(); // RestoreAssetsDto | 

try {
    final result = api_instance.restoreDeletedAssets(restoreAssetsDto);
    print(result);
} catch (e) {
    print('Exception when calling RecycleBinApi->restoreDeletedAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **restoreAssetsDto** | [**RestoreAssetsDto**](RestoreAssetsDto.md)|  | 

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

