abstract interface class INetworkRepository {
  Future<String?> getWifiName();
  Future<String?> getWifiIp();
}
