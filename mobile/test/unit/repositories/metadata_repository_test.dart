import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';

void main() {
  group('codec', () {
    test('every MetadataKey encodes and decodes values losslessly', () {
      for (final key in MetadataKey.values) {
        final encoded = MetadataRepository.encode(key.defaultValue);
        final decoded = MetadataRepository.decode(key, encoded);
        expect(decoded, key.defaultValue, reason: 'codec round-trip failed for ${key.name}');
      }
    });
  });
}
