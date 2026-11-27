import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/config/network_config.dart';

void main() {
  group('NetworkConfig.endpointForWifi', () {
    const config = NetworkConfig(
      localEndpoint: 'http://10.0.1.11:2283',
      localWifiNetworks: {'wifi1': '', 'wifi2': 'http://10.0.1.22:2283'},
    );

    test('uses the default local endpoint when no custom endpoint is set', () {
      expect(config.endpointForWifi('wifi1'), 'http://10.0.1.11:2283');
    });

    test('uses the custom endpoint when set', () {
      expect(config.endpointForWifi('wifi2'), 'http://10.0.1.22:2283');
    });

    test('returns null for an unknown network', () {
      expect(config.endpointForWifi('other'), isNull);
    });

    test('returns null when neither a custom nor a default endpoint is set', () {
      const config = NetworkConfig(localWifiNetworks: {'wifi1': ''});
      expect(config.endpointForWifi('wifi1'), isNull);
    });

    test('falls back to the legacy preferred Wi-Fi name', () {
      const config = NetworkConfig(preferredWifiName: 'home', localEndpoint: 'http://10.0.1.11:2283');
      expect(config.wifiNetworks, {'home': ''});
      expect(config.endpointForWifi('home'), 'http://10.0.1.11:2283');
    });

    test('ignores the legacy preferred Wi-Fi name once networks are configured', () {
      const config = NetworkConfig(
        preferredWifiName: 'home',
        localEndpoint: 'http://10.0.1.11:2283',
        localWifiNetworks: {'wifi1': ''},
      );
      expect(config.endpointForWifi('home'), isNull);
    });
  });
}
