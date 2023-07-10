import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart';

void main() {
  // We have to initialize the tz database
  setUp(() {
    tz.initializeTimeZones();
  });

  // Since DateTime is formatted based on the locale, we make sure we set a locale
  Widget createLocalizedWidget({required Widget child}) {
    return MaterialApp(
      supportedLocales: const [
        Locale('en', ''),
      ],
      home: child,
    );
  }

  testWidgets('Creation date is adjusted to IANA timezone', (tester) async {
    await tester.pumpWidget(
      createLocalizedWidget(
        child: ExifBottomSheet(
          asset: Asset(
            checksum: 'totally-legit-checksum',
            localId: 'localId',
            ownerId: 1,
            fileCreatedAt:
                DateTime.fromMillisecondsSinceEpoch(1688956100 * 1000),
            fileModifiedAt: DateTime.now(),
            updatedAt: DateTime.now(),
            durationInSeconds: 1,
            type: AssetType.image,
            fileName: 'sampleAsset',
            isFavorite: false,
            isArchived: false,
            exifInfo: ExifInfo(timeZone: 'Europe/Berlin'),
          ),
        ),
      ),
    );

    final creationDateFinder =
        find.text('Mon, Jul 10, 2023 • 4:28 AM GMT+02:00');

    expect(creationDateFinder, findsOneWidget);
  });

  testWidgets('Creation date is adjusted to offset timezone', (tester) async {
    await tester.pumpWidget(
      createLocalizedWidget(
        child: ExifBottomSheet(
          asset: Asset(
            checksum: 'totally-legit-checksum',
            localId: 'localId',
            ownerId: 1,
            fileCreatedAt: DateTime.fromMillisecondsSinceEpoch(
              1688956100 * 1000,
            ),
            // DateTime.fromMillisecondsSinceEpoch(1688956100 * 1000),
            fileModifiedAt: DateTime.now(),
            updatedAt: DateTime.now(),
            durationInSeconds: 1,
            type: AssetType.image,
            fileName: 'sampleAsset',
            isFavorite: false,
            isArchived: false,
            exifInfo: ExifInfo(timeZone: 'UTC-5'),
          ),
        ),
      ),
    );

    final creationDateFinder =
        find.text('Sun, Jul 9, 2023 • 9:28 PM GMT-05:00');

    expect(creationDateFinder, findsOneWidget);
  });

  testWidgets('No timezone is adjusted to local timezone', (tester) async {
    await tester.pumpWidget(
      createLocalizedWidget(
        child: ExifBottomSheet(
          asset: Asset(
            checksum: 'totally-legit-checksum',
            localId: 'localId',
            ownerId: 1,
            fileCreatedAt: TZDateTime.fromMillisecondsSinceEpoch(
              getLocation('America/New_York'),
              1688956100 * 1000,
            ),
            fileModifiedAt: DateTime.now(),
            updatedAt: DateTime.now(),
            durationInSeconds: 1,
            type: AssetType.image,
            fileName: 'sampleAsset',
            isFavorite: false,
            isArchived: false,
          ),
        ),
      ),
    );

    final creationDateFinder =
        find.text('Sun, Jul 9, 2023 • 10:28 PM GMT-04:00');

    expect(creationDateFinder, findsOneWidget);
  });
}
