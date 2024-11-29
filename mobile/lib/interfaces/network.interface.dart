abstract interface class INetworkRepository {
  Future<String?> getWifiName();
  Future<String?> getWifiIp();

  Future<bool> isWifiConnected();
  Future<bool> isVpnConnected();
  Future<bool> isMobileDataConnected();
}
