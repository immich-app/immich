import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';

void main() {
  // Two day-segments, 4 columns, 8 assets each (2 rows). header 50, tile 100, no spacing.
  //   A: header@[0,50)  rows@50,150   assets 0..7    offset [0,250]
  //   B: header@[250,300) rows@300,400 assets 8..15  offset [250,500]
  const columnCount = 4;
  const maxScrollExtent = 500.0;
  final segments = <Segment>[
    const FixedSegment(
      firstIndex: 0,
      lastIndex: 2,
      startOffset: 0,
      endOffset: 250,
      firstAssetIndex: 0,
      bucket: Bucket(assetCount: 8),
      tileHeight: 100,
      columnCount: columnCount,
      headerExtent: 50,
      spacing: 0,
      header: HeaderType.day,
    ),
    const FixedSegment(
      firstIndex: 3,
      lastIndex: 5,
      startOffset: 250,
      endOffset: 500,
      firstAssetIndex: 8,
      bucket: Bucket(assetCount: 8),
      tileHeight: 100,
      columnCount: columnCount,
      headerExtent: 50,
      spacing: 0,
      header: HeaderType.day,
    ),
  ];

  int? at(double offset) =>
      assetIndexAtOffset(segments, offset, columnCount: columnCount, maxScrollExtent: maxScrollExtent);

  test('maps an offset to the first asset of the row shown there', () {
    expect(at(0), 0); // top of segment A
    expect(at(150), 4); // second row of A
    expect(at(350), 8); // first row of B
    expect(at(450), 12); // second row of B
  });

  test('clamps offsets outside the scroll range', () {
    expect(at(-100), 0); // below the top -> first asset
    expect(at(9999), at(maxScrollExtent)); // past the end -> same as the max offset
  });

  test('returns null for empty segments', () {
    expect(assetIndexAtOffset(const [], 100, columnCount: columnCount, maxScrollExtent: maxScrollExtent), isNull);
  });
}
