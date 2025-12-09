import 'package:immich_mobile/platform/connectivity_api.g.dart';

extension NetworkCapabilitiesGetters on List<NetworkCapability> {
  bool get hasCellular => contains(NetworkCapability.cellular);
  bool get hasWifi => contains(NetworkCapability.wifi);
  bool get hasVpn => contains(NetworkCapability.vpn);
  bool get isUnmetered => contains(NetworkCapability.unmetered);
}
