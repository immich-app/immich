import 'package:immich_mobile/platform/connectivity_api.g.dart';

extension NetworkCapabilitiesGetters on List<NetworkCapability> {
  // ignore: unused-code
  bool get hasCellular => contains(NetworkCapability.cellular);
  // ignore: unused-code
  bool get hasWifi => contains(NetworkCapability.wifi);
  // ignore: unused-code
  bool get hasVpn => contains(NetworkCapability.vpn);
  bool get isUnmetered => contains(NetworkCapability.unmetered);
}
