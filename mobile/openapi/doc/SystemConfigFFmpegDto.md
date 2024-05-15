# openapi.model.SystemConfigFFmpegDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accel** | [**TranscodeHWAccel**](TranscodeHWAccel.md) |  | 
**accelDecode** | **bool** |  | 
**acceptedAudioCodecs** | [**List<AudioCodec>**](AudioCodec.md) |  | [default to const []]
**acceptedVideoCodecs** | [**List<VideoCodec>**](VideoCodec.md) |  | [default to const []]
**bframes** | **int** |  | 
**cqMode** | [**CQMode**](CQMode.md) |  | 
**crf** | **int** |  | 
**gopSize** | **int** |  | 
**maxBitrate** | **String** |  | 
**npl** | **int** |  | 
**preferredHwDevice** | **String** |  | 
**preset** | **String** |  | 
**refs** | **int** |  | 
**targetAudioCodec** | [**AudioCodec**](AudioCodec.md) |  | 
**targetResolution** | **String** |  | 
**targetVideoCodec** | [**VideoCodec**](VideoCodec.md) |  | 
**temporalAQ** | **bool** |  | 
**threads** | **int** |  | 
**tonemap** | [**ToneMapping**](ToneMapping.md) |  | 
**transcode** | [**TranscodePolicy**](TranscodePolicy.md) |  | 
**twoPass** | **bool** |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


