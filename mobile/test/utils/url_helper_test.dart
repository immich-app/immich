import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:isar/isar.dart';

import '../test_utils.dart';

void main() {
  late Isar db;

  setUpAll(() async {
    db = await TestUtils.initIsar();
    await StoreService.init(storeRepository: IsarStoreRepository(db));
  });


  group('sanitizeUrl', () {
    test('Should encode correctly', () {
      var unEncodedURL = 'user:password@example.com/addSchemaAndRemovesSlashes////';
      expect(sanitizeUrl(unEncodedURL), 'https://user:password@example.com/addSchemaAndRemovesSlashes');
    });

    test('does not switch http to https', () {
      var unEncodedURL = 'http://user:password@example.com/addSchemaAndRemovesSlashes////';
      expect(sanitizeUrl(unEncodedURL), 'http://user:password@example.com/addSchemaAndRemovesSlashes');
    });
  });

  group('punycodeEncode', () {
    test('malformed URL returns a blank string', () {
      var badURL = 'example.com/missing a scheme';
      expect(punycodeEncodeUrl(badURL), '');
    });

    test('Encodes IDNs correctly', () {
      var idn = 'https://bücher.de';
      expect(punycodeEncodeUrl(idn), 'https://xn--bcher-kva.de');
    });
   
    test('Keeps basic auth in encoding', () {
      var basicAuthURL = 'https://user:password@example.com';
      expect(punycodeEncodeUrl(basicAuthURL), 'https://user:password@example.com');
    });
  });

  group('punycodeDecode', () {
   test('malformed URL returns a null', () {
      var badURL = 'example.com/missing%20a%20scheme';
      expect(punycodeDecodeUrl(badURL), null);
    });

    test('Decodes IDNs correctly', () {
      var idn = 'https://xn--bcher-kva.de';
      expect(punycodeDecodeUrl(idn), 'https://bücher.de');
    });
   
    test('Keeps basic auth in encoding', () {
      var basicAuthURL = 'https://user:password@example.com/%20with%20spaces';
      expect(punycodeDecodeUrl(basicAuthURL), 'https://user:password@example.com/ with spaces');
    });
  });

  group('getServerUrl', () {
    test('Returns null if not set', () {
      expect(getServerUrl(), null);
    });

    test('Returns null if what was set is not a correct url', () {
      Store.put(StoreKey.serverEndpoint, 'example.com');
      expect(getServerUrl(), null);
    });
    
    test('Returns decoded basic URL', () async {
      var encodedURL = 'https://example.com/ clears extra paths';
      await Store.put(StoreKey.serverEndpoint, encodedURL);
      expect(getServerUrl(), 'https://example.com');
    });

    test('Returns decoded basic auth URL', () async {
      var basicAuthURL = 'https://user:password@example.com';
      await Store.put(StoreKey.serverEndpoint, basicAuthURL);
      expect(getServerUrl(), basicAuthURL);
    });

    test('Returns decoded URL with a port', () async {
      var portURL = 'https://example.com:1337';
      await Store.put(StoreKey.serverEndpoint, portURL);
      expect(getServerUrl(), portURL);
    });

      test('Returns decoded complex URL', () async {
      var complexURL = 'https://user:password@example.com:1337/123/abc';
      await Store.put(StoreKey.serverEndpoint, complexURL);
      expect(getServerUrl(), 'https://user:password@example.com:1337');
    });

  });
}
