import 'package:flutter/foundation.dart';
import 'package:immich_mobile/utils/option.dart';

class NetworkConfig {
  final bool autoEndpointSwitching;
  final String? preferredWifiName;
  final String? localEndpoint;
  final List<String> externalEndpointList;
  final Map<String, String> customHeaders;

  const NetworkConfig({
    this.autoEndpointSwitching = false,
    this.preferredWifiName,
    this.localEndpoint,
    this.externalEndpointList = const [],
    this.customHeaders = const {},
  });

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

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is NetworkConfig &&
          other.autoEndpointSwitching == autoEndpointSwitching &&
          other.preferredWifiName == preferredWifiName &&
          other.localEndpoint == localEndpoint &&
          listEquals(other.externalEndpointList, externalEndpointList) &&
          mapEquals(other.customHeaders, customHeaders));

  @override
  int get hashCode => Object.hash(
    autoEndpointSwitching,
    preferredWifiName,
    localEndpoint,
    Object.hashAll(externalEndpointList),
    Object.hashAllUnordered(customHeaders.entries.map((e) => Object.hash(e.key, e.value))),
  );

  @override
  String toString() =>
      'NetworkConfig(autoEndpointSwitching: $autoEndpointSwitching, preferredWifiName: $preferredWifiName, localEndpoint: $localEndpoint, externalEndpointList: $externalEndpointList, customHeaders: $customHeaders)';
}
