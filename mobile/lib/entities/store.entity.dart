import 'dart:convert';
import 'dart:typed_data';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

// ignore: non_constant_identifier_names
final Store = StoreService.I;

class SSLClientCertStoreVal {
  final Uint8List data;
  final String? password;

  const SSLClientCertStoreVal(this.data, this.password);

  Future<void> save() async {
    final b64Str = base64Encode(data);
    await Store.put(StoreKey.sslClientCertData, b64Str);
    if (password != null) {
      await Store.put(StoreKey.sslClientPasswd, password!);
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

  static Future<void> delete() async {
    await Store.delete(StoreKey.sslClientCertData);
    await Store.delete(StoreKey.sslClientPasswd);
  }
}
