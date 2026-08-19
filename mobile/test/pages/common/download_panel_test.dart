import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/pages/common/download_panel.dart';

import '../../widget_tester_extensions.dart';

void main() {
  testWidgets('complete uses a checkmark and other statuses use close', (tester) async {
    await tester.pumpConsumerWidget(
      DownloadTaskTile(progress: 1, fileName: 'photo.jpg', status: TaskStatus.complete, onCancelDownload: () {}),
    );

    expect(find.byIcon(Icons.download_done), findsOneWidget);
    expect(find.byIcon(Icons.close), findsNothing);

    await tester.pumpConsumerWidget(
      DownloadTaskTile(progress: 1, fileName: 'photo.jpg', status: TaskStatus.failed, onCancelDownload: () {}),
    );

    expect(find.byIcon(Icons.download_done), findsNothing);
    expect(find.byIcon(Icons.close), findsOneWidget);
  });
}
