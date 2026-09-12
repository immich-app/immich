import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/panorama_viewer.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
import '../../../unit/factories/remote_asset_factory.dart';
import '../../../widget_tester_extensions.dart';

void main() {
  group('parseGPanoCrop', () {
    test('parses the XMP exiftool writes into previews, in both tag styles', () {
      // Element style, as the server's copyTagGroup produces
      const elements = '''
  <GPano:CroppedAreaImageHeightPixels>1667</GPano:CroppedAreaImageHeightPixels>
  <GPano:CroppedAreaImageWidthPixels>4460</GPano:CroppedAreaImageWidthPixels>
  <GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>
  <GPano:CroppedAreaTopPixels>2035</GPano:CroppedAreaTopPixels>
  <GPano:FullPanoHeightPixels>4601</GPano:FullPanoHeightPixels>
  <GPano:FullPanoWidthPixels>9202</GPano:FullPanoWidthPixels>''';
      // Attribute style, as cameras write into originals
      const attributes =
          '<rdf:Description GPano:CroppedAreaLeftPixels="0" GPano:CroppedAreaTopPixels="2035" '
          'GPano:CroppedAreaImageWidthPixels="4460" GPano:CroppedAreaImageHeightPixels="1667" '
          'GPano:FullPanoWidthPixels="9202" GPano:FullPanoHeightPixels="4601"/>';
      const expected = Rect.fromLTWH(0, 2035 / 4601, 4460 / 9202, 1667 / 4601);

      expect(parseGPanoCrop(elements), expected);
      expect(parseGPanoCrop(attributes), expected);
      expect(parseGPanoCrop('no GPano tags'), isNull);
    });
  });

  group('PanoramaBadge', () {
    testWidgets('shows the 360° badge only for equirectangular photos', (tester) async {
      for (final (asset, projectionType, expected) in [
        (RemoteAssetFactory.create(), ProjectionType.equirectangular, findsOneWidget),
        (RemoteAssetFactory.create(), null, findsNothing),
        // Equirectangular videos are ignored, like web
        (RemoteAssetFactory.create(type: .video), ProjectionType.equirectangular, findsNothing),
      ]) {
        final assetService = MockAssetService();
        when(() => assetService.getExif(asset)).thenAnswer((_) async => ExifInfo(projectionType: projectionType));

        await tester.pumpConsumerWidget(
          PanoramaBadge(asset: asset),
          overrides: [assetServiceProvider.overrideWithValue(assetService)],
        );

        expect(find.byIcon(Icons.threesixty_rounded), expected);
      }
    });
  });
}
