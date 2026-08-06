# openapi.api.MapApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getMapMarkers**](MapApi.md#getmapmarkers) | **GET** /map/markers | Retrieve map markers
[**reverseGeocode**](MapApi.md#reversegeocode) | **GET** /map/reverse-geocode | Reverse geocode coordinates


# **getMapMarkers**
> List<MapMarkerResponseDto> getMapMarkers(fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite, withPartners, withSharedAlbums)

Retrieve map markers

Retrieve a list of latitude and longitude coordinates for every asset with location data.

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

final api_instance = MapApi();
final fileCreatedAfter = 2024-01-01T00:00Z; // DateTime | Filter assets created after this date
final fileCreatedBefore = 2024-01-01T00:00Z; // DateTime | Filter assets created before this date
final isArchived = true; // bool | Filter by archived status
final isFavorite = true; // bool | Filter by favorite status
final withPartners = true; // bool | Include partner assets
final withSharedAlbums = true; // bool | Include shared album assets

try {
    final result = api_instance.getMapMarkers(fileCreatedAfter, fileCreatedBefore, isArchived, isFavorite, withPartners, withSharedAlbums);
    print(result);
} catch (e) {
    print('Exception when calling MapApi->getMapMarkers: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fileCreatedAfter** | **DateTime**| Filter assets created after this date | [optional] 
 **fileCreatedBefore** | **DateTime**| Filter assets created before this date | [optional] 
 **isArchived** | **bool**| Filter by archived status | [optional] 
 **isFavorite** | **bool**| Filter by favorite status | [optional] 
 **withPartners** | **bool**| Include partner assets | [optional] 
 **withSharedAlbums** | **bool**| Include shared album assets | [optional] 

### Return type

[**List<MapMarkerResponseDto>**](MapMarkerResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reverseGeocode**
> List<MapReverseGeocodeResponseDto> reverseGeocode(lat, lon)

Reverse geocode coordinates

Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.

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

final api_instance = MapApi();
final lat = 1.2; // double | Latitude (-90 to 90)
final lon = 1.2; // double | Longitude (-180 to 180)

try {
    final result = api_instance.reverseGeocode(lat, lon);
    print(result);
} catch (e) {
    print('Exception when calling MapApi->reverseGeocode: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **lat** | **double**| Latitude (-90 to 90) | 
 **lon** | **double**| Longitude (-180 to 180) | 

### Return type

[**List<MapReverseGeocodeResponseDto>**](MapReverseGeocodeResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

