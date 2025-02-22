import 'dart:convert';
import 'dart:typed_data';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

// ignore: non_constant_identifier_names
final Store = StoreService.I;

class SSLClientCertStoreVal {
  final Uint8List data;
  final String? password;

  SSLClientCertStoreVal(this.data, this.password);

  void save() {
    final b64Str = base64Encode(data);
    Store.put(StoreKey.sslClientCertData, b64Str);
    if (password != null) {
      Store.put(StoreKey.sslClientPasswd, password!);
    }
  }

  static SSLClientCertStoreVal? load() {
    final b64Str = Store.tryGet<String>(StoreKey.sslClientCertData);
    if (b64Str == null) {
      return null;
    }
    final Uint8List certData = base64Decode(b64Str);
    final passwd = Store.tryGet<String>(StoreKey.sslClientPasswd);
    return SSLClientCertStoreVal(certData, passwd);
  }

  static void delete() {
    Store.delete(StoreKey.sslClientCertData);
    Store.delete(StoreKey.sslClientPasswd);
  }
}
