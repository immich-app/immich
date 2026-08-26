// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/option.dart';

part 'network_config.freezed.dart';

@Freezed(copyWith: false)
class const NetworkConfig({
  final bool autoEndpointSwitching = false,
  final String? preferredWifiName,
  final String? localEndpoint,
  final List<String> externalEndpointList = const [],
  final Map<String, String> customHeaders = const {},
}) with _$NetworkConfig {
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
