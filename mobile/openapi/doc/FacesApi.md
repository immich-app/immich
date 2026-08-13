# openapi.api.FacesApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createFace**](FacesApi.md#createface) | **POST** /faces | Create a face
[**deleteFace**](FacesApi.md#deleteface) | **DELETE** /faces/{id} | Delete a face
[**getFaces**](FacesApi.md#getfaces) | **GET** /faces | Retrieve faces for asset
[**reassignFacesById**](FacesApi.md#reassignfacesbyid) | **PUT** /faces/{id} | Re-assign a face to another person


# **createFace**
> createFace(assetFaceCreateDto)

Create a face

Create a new face that has not been discovered by facial recognition. The content of the bounding box is considered a face.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = FacesApi();
final assetFaceCreateDto = AssetFaceCreateDto(); // AssetFaceCreateDto | 

try {
    api_instance.createFace(assetFaceCreateDto);
} catch (e) {
    print('Exception when calling FacesApi->createFace: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetFaceCreateDto** | [**AssetFaceCreateDto**](AssetFaceCreateDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteFace**
> deleteFace(id, assetFaceDeleteDto)

Delete a face

Delete a face identified by the id. Optionally can be force deleted.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = FacesApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final assetFaceDeleteDto = AssetFaceDeleteDto(); // AssetFaceDeleteDto | 

try {
    api_instance.deleteFace(id, assetFaceDeleteDto);
} catch (e) {
    print('Exception when calling FacesApi->deleteFace: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **assetFaceDeleteDto** | [**AssetFaceDeleteDto**](AssetFaceDeleteDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getFaces**
> List<AssetFaceResponseDto> getFaces(id)

Retrieve faces for asset

Retrieve all faces belonging to an asset.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = FacesApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Face ID

try {
    final result = api_instance.getFaces(id);
    print(result);
} catch (e) {
    print('Exception when calling FacesApi->getFaces: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Face ID | 

### Return type

[**List<AssetFaceResponseDto>**](AssetFaceResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reassignFacesById**
> PersonResponseDto reassignFacesById(id, faceDto)

Re-assign a face to another person

Re-assign the face provided in the body to the person identified by the id in the path parameter.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = FacesApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final faceDto = FaceDto(); // FaceDto | 

try {
    final result = api_instance.reassignFacesById(id, faceDto);
    print(result);
} catch (e) {
    print('Exception when calling FacesApi->reassignFacesById: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **faceDto** | [**FaceDto**](FaceDto.md)|  | 

### Return type

[**PersonResponseDto**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

