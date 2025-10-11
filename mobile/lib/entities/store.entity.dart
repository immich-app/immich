import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

// ignore: non_constant_identifier_names
final Store = StoreService.I;

class SSLClientCertStoreVal {
  final String privateKeyAlias;
  const SSLClientCertStoreVal(this.privateKeyAlias);

  Future<void> save() async {
    await Store.put(StoreKey.mTlsSelectedPrivateKey, privateKeyAlias);
  }

  static SSLClientCertStoreVal? load() {
    final privateKeyAlias = Store.tryGet<String>(StoreKey.mTlsSelectedPrivateKey) ?? "";
    return SSLClientCertStoreVal(privateKeyAlias);
  }

  static Future<void> delete() async {
    await Store.delete(StoreKey.mTlsSelectedPrivateKey);
  }
}
