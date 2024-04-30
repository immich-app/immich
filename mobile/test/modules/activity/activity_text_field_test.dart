@Skip('currently failing due to mock HTTP client to download ISAR binaries')
@Tags(['widget'])

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/activities/providers/activity.provider.dart';
import 'package:immich_mobile/modules/activities/widgets/activity_text_field.dart';
import 'package:immich_mobile/modules/album/providers/current_album.provider.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../fixtures/album.stub.dart';
import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import '../album/album_mocks.dart';
import '../shared/shared_mocks.dart';
import 'activity_mocks.dart';

void main() {
  late Isar db;
  late MockCurrentAlbumProvider mockCurrentAlbumProvider;
  late MockAlbumActivity activityMock;
  late List<Override> overrides;

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    Store.init(db);
    Store.put(StoreKey.currentUser, UserStub.admin);
    Store.put(StoreKey.serverEndpoint, '');
  });

  setUp(() {
    mockCurrentAlbumProvider = MockCurrentAlbumProvider(AlbumStub.twoAsset);
    activityMock = MockAlbumActivity();
    overrides = [
      currentAlbumProvider.overrideWith(() => mockCurrentAlbumProvider),
      albumActivityProvider(AlbumStub.twoAsset.remoteId!)
          .overrideWith(() => activityMock),
    ];
  });

  testWidgets('Returns an Input text field', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
      ),
      overrides: overrides,
    );

    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('No UserCircleAvatar when user == null', (tester) async {
    final userProvider = MockCurrentUserProvider();

    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
      ),
      overrides: [
        currentUserProvider.overrideWith((ref) => userProvider),
        ...overrides,
      ],
    );

    expect(find.byType(UserCircleAvatar), findsNothing);
  });

  testWidgets('UserCircleAvatar displayed when user != null', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
      ),
      overrides: overrides,
    );

    expect(find.byType(UserCircleAvatar), findsOneWidget);
  });

  testWidgets(
    'Filled icon if likedId != null',
    (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTextField(
          onSubmit: (_) {},
          likeId: '1',
        ),
        overrides: overrides,
      );

      expect(
        find.widgetWithIcon(IconButton, Icons.favorite_rounded),
        findsOneWidget,
      );
      expect(
        find.widgetWithIcon(IconButton, Icons.favorite_border_rounded),
        findsNothing,
      );
    },
  );

  testWidgets('Bordered icon if likedId == null', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
      ),
      overrides: overrides,
    );

    expect(
      find.widgetWithIcon(IconButton, Icons.favorite_border_rounded),
      findsOneWidget,
    );
    expect(
      find.widgetWithIcon(IconButton, Icons.favorite_rounded),
      findsNothing,
    );
  });

  testWidgets('Adds new like', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
      ),
      overrides: overrides,
    );

    when(() => activityMock.addLike()).thenAnswer((_) => Future.value());

    final suffixIcon = find.byType(IconButton);
    await tester.tap(suffixIcon);

    verify(() => activityMock.addLike());
  });

  testWidgets('Removes like if already liked', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
        likeId: 'test-suffix',
      ),
      overrides: overrides,
    );

    when(() => activityMock.removeActivity(any()))
        .thenAnswer((_) => Future.value());

    final suffixIcon = find.byType(IconButton);
    await tester.tap(suffixIcon);

    verify(() => activityMock.removeActivity('test-suffix'));
  });

  testWidgets('Passes text entered to onSubmit on submit', (tester) async {
    String? receivedText;

    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (text) => receivedText = text,
        likeId: 'test-suffix',
      ),
      overrides: overrides,
    );

    final textField = find.byType(TextField);
    await tester.enterText(textField, 'This is a test comment');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    expect(receivedText, 'This is a test comment');
  });

  testWidgets('Input disabled when isEnabled false', (tester) async {
    String? receviedText;

    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (text) => receviedText = text,
        isEnabled: false,
        likeId: 'test-suffix',
      ),
      overrides: overrides,
    );

    final suffixIcon = find.byType(IconButton);
    await tester.tap(suffixIcon, warnIfMissed: false);

    final textField = find.byType(TextField);
    await tester.enterText(textField, 'This is a test comment');
    await tester.testTextInput.receiveAction(TextInputAction.done);

    expect(receviedText, isNull);
    verifyNever(() => activityMock.addLike());
    verifyNever(() => activityMock.removeActivity(any()));
  });
}
