import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/search/quick_date_picker.dart';

import '../../../widget_tester_extensions.dart';

void main() {
  group('YearFilter', () {
    testWidgets('formats the year without a thousands separator', (tester) async {
      await tester.pumpConsumerWidget(const SizedBox.shrink());
      final label = YearFilter(2005).asHumanReadable(tester.element(find.byType(SizedBox)));
      expect(label, 'In 2005');
    });
  });
}
