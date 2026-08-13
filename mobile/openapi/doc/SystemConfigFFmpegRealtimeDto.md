# openapi.model.SystemConfigFFmpegRealtimeDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**enabled** | **bool** | Enable real-time HLS transcoding (alpha) | 
**resolutions** | [**List<HlsVideoResolution>**](HlsVideoResolution.md) | Resolutions to use for real-time HLS transcoding | [default to const []]
**videoCodecs** | [**List<VideoCodec>**](VideoCodec.md) | Video codecs to use for real-time HLS transcoding | [default to const []]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


