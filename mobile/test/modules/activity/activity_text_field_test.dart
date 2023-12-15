import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/activities/widgets/activity_text_field.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';

import '../../widget_tester_extensions.dart';
import '../shared/shared_mocks.dart';

void main() {
  late MockCurrentUserProvider userProvider;

  setUp(() {
    userProvider = MockCurrentUserProvider();
  });

  testWidgets('Displays Input text field', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
        onSuffixTapped: (_) {},
      ),
      overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
    );

    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('No UserCircleAvatar when user == null', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
        onSuffixTapped: (_) {},
      ),
      overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
    );

    expect(find.byType(UserCircleAvatar), findsNothing);
  });

  testWidgets(
    'UserCircleAvatar displayed when user != null',
    (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTextField(
          onSubmit: (_) {},
          onSuffixTapped: (_) {},
        ),
        overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
      );

      expect(find.byType(UserCircleAvatar), findsOneWidget);
    }, // TODO: Remove skip once migrated to IsarCore 4 or store migrated to provider
    skip: true,
  );

  testWidgets(
    'Filled icon if likedId != null',
    (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTextField(
          onSubmit: (_) {},
          onSuffixTapped: (_) {},
          likeId: '1',
        ),
        overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
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
        onSuffixTapped: (_) {},
      ),
      overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
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

  testWidgets('Passes likeId to onSuffixTapped on tapping Suffix icon',
      (tester) async {
    String? receivedLikeId;

    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (_) {},
        onSuffixTapped: (likeId) => receivedLikeId = likeId,
        likeId: 'test-suffix',
      ),
      overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
    );

    final suffixIcon = find.byType(IconButton);
    await tester.tap(suffixIcon);
    expect(receivedLikeId, 'test-suffix');
  });

  testWidgets('Passes text entered to onSubmit on submit', (tester) async {
    String? receivedText;

    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (text) => receivedText = text,
        onSuffixTapped: (_) {},
        likeId: 'test-suffix',
      ),
      overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
    );

    final textField = find.byType(TextField);
    await tester.enterText(textField, 'This is a test comment');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    expect(receivedText, 'This is a test comment');
  });

  testWidgets('Input disabled when isEnabled false', (tester) async {
    String? receviedText;
    String? receivedLikeId;

    await tester.pumpConsumerWidget(
      ActivityTextField(
        onSubmit: (text) => receviedText = text,
        onSuffixTapped: (likeId) => receivedLikeId = likeId,
        isEnabled: false,
        likeId: 'test-suffix',
      ),
      overrides: [currentUserProvider.overrideWith((ref) => userProvider)],
    );

    final suffixIcon = find.byType(IconButton);
    await tester.tap(suffixIcon);

    final textField = find.byType(TextField);
    await tester.enterText(textField, 'This is a test comment');
    await tester.testTextInput.receiveAction(TextInputAction.done);

    expect(receivedLikeId, isNull);
    expect(receviedText, isNull);
  });
}
