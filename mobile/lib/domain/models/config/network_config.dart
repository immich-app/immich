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
    @Default({}) Map<String, String> localWifiNetworks,
    @Default([]) List<String> externalEndpointList,
    @Default({}) Map<String, String> customHeaders,
  }) = _NetworkConfig;

  // We patch `preferredWifiName` and `localEndpoint`, which prevents us from using Freezed `copyWith`
  NetworkConfig copyWith({
    bool? autoEndpointSwitching,
    Option<String>? preferredWifiName,
    Option<String>? localEndpoint,
    Map<String, String>? localWifiNetworks,
    List<String>? externalEndpointList,
    Map<String, String>? customHeaders,
  }) => NetworkConfig(
    autoEndpointSwitching: autoEndpointSwitching ?? this.autoEndpointSwitching,
    preferredWifiName: preferredWifiName.patch(this.preferredWifiName),
    localEndpoint: localEndpoint.patch(this.localEndpoint),
    localWifiNetworks: localWifiNetworks ?? this.localWifiNetworks,
    externalEndpointList: externalEndpointList ?? this.externalEndpointList,
    customHeaders: customHeaders ?? this.customHeaders,
  );

  //provides custom local endpoint for a given SSID, empty endpoint means [localEndpoint] is used
  //falls back to the legacy single [preferredWifiName].
  Map<String, String> get wifiNetworks {
    if (localWifiNetworks.isNotEmpty) {
      return localWifiNetworks;
    }

    final wifiName = preferredWifiName;
    if (wifiName != null && wifiName.isNotEmpty) {
      return {wifiName: ''};
    }

    return const {};
  }

  //returns the local endpoint to use when connected to a [wifiName], or null if the network is not configured
  String? endpointForWifi(String wifiName) {
    final custom = wifiNetworks[wifiName];
    if (custom == null) {
      return null;
    }

    final url = custom.isNotEmpty ? custom : localEndpoint;
    return (url == null || url.isEmpty) ? null : url;
  }
}
