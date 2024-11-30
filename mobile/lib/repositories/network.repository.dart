import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/network.interface.dart';
import 'package:network_info_plus/network_info_plus.dart';

final networkRepositoryProvider = Provider((_) {
  final networkInfo = NetworkInfo();
  final connectivity = Connectivity();

  return NetworkRepository(networkInfo, connectivity);
});

class NetworkRepository implements INetworkRepository {
  final NetworkInfo _networkInfo;
  final Connectivity _connectivity;

  NetworkRepository(this._networkInfo, this._connectivity);

  @override
  Future<String?> getWifiName() {
    if (Platform.isAndroid) {
      // remove quote around the return value on Android
      // https://github.com/fluttercommunity/plus_plugins/tree/main/packages/network_info_plus/network_info_plus#android
      return _networkInfo.getWifiName().then((value) {
        if (value != null) {
          return value.replaceAll(RegExp(r'"'), '');
        }
        return value;
      });
    }
    return _networkInfo.getWifiName();
  }

  @override
  Future<String?> getWifiIp() {
    return _networkInfo.getWifiIP();
  }

  @override
  Future<bool> isMobileDataConnected() async {
    final result = await _connectivity.checkConnectivity();
    return result.contains(ConnectivityResult.mobile);
  }

  @override
  Future<bool> isWifiConnected() async {
    final result = await _connectivity.checkConnectivity();
    return result.contains(ConnectivityResult.wifi);
  }

  @override
  Future<bool> isVpnConnected() async {
    final result = await _connectivity.checkConnectivity();
    return result.contains(ConnectivityResult.vpn);
  }
}
