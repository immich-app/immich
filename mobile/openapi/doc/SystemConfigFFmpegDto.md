# openapi.model.SystemConfigFFmpegDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accel** | [**TranscodeHWAccel**](TranscodeHWAccel.md) |  | 
**accelDecode** | **bool** | Accelerated decode | 
**acceptedAudioCodecs** | [**List<AudioCodec>**](AudioCodec.md) | Accepted audio codecs | [default to const []]
**acceptedContainers** | [**List<VideoContainer>**](VideoContainer.md) | Accepted containers | [default to const []]
**acceptedVideoCodecs** | [**List<VideoCodec>**](VideoCodec.md) | Accepted video codecs | [default to const []]
**bframes** | **int** | B-frames | 
**cqMode** | [**CQMode**](CQMode.md) |  | 
**crf** | **int** | CRF | 
**gopSize** | **int** | GOP size | 
**maxBitrate** | **String** | Max bitrate | 
**preferredHwDevice** | **String** | Preferred hardware device | 
**preset** | **String** | Preset | 
**realtime** | [**SystemConfigFFmpegRealtimeDto**](SystemConfigFFmpegRealtimeDto.md) |  | 
**refs** | **int** | References | 
**targetAudioCodec** | [**AudioCodec**](AudioCodec.md) |  | 
**targetResolution** | **String** | Target resolution | 
**targetVideoCodec** | [**VideoCodec**](VideoCodec.md) |  | 
**temporalAQ** | **bool** | Temporal AQ | 
**threads** | **int** | Threads | 
**tonemap** | [**ToneMapping**](ToneMapping.md) |  | 
**transcode** | [**TranscodePolicy**](TranscodePolicy.md) |  | 
**twoPass** | **bool** | Two pass | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


