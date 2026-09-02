import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/option.dart';

part 'network_config.freezed.dart';

@Freezed(copyWith: false)
abstract class NetworkConfig with _$NetworkConfig {
  const NetworkConfig._();

  const factory NetworkConfig({
    @Default(false) bool autoEndpointSwitching,
    String? preferredWifiName,
    String? localEndpoint,
    @Default([]) List<String> externalEndpointList,
    @Default({}) Map<String, String> customHeaders,
  }) = _NetworkConfig;

  // We patch `preferredWifiName` and `localEndpoint`, which prevents us from using Freezed `copyWith`
  NetworkConfig copyWith({
    bool? autoEndpointSwitching,
    Option<String>? preferredWifiName,
    Option<String>? localEndpoint,
    List<String>? externalEndpointList,
    Map<String, String>? customHeaders,
  }) => NetworkConfig(
    autoEndpointSwitching: autoEndpointSwitching ?? this.autoEndpointSwitching,
    preferredWifiName: preferredWifiName.patch(this.preferredWifiName),
    localEndpoint: localEndpoint.patch(this.localEndpoint),
    externalEndpointList: externalEndpointList ?? this.externalEndpointList,
    customHeaders: customHeaders ?? this.customHeaders,
  );
}
