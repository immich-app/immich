import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:network_info_plus/network_info_plus.dart';

final networkRepositoryProvider = Provider((_) {
  final networkInfo = NetworkInfo();

  return NetworkRepository(networkInfo);
});

class NetworkRepository {
  final NetworkInfo _networkInfo;

  NetworkRepository(this._networkInfo);

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

  Future<String?> getWifiIp() {
    return _networkInfo.getWifiIP();
  }
}
