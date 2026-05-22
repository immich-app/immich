import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/remote_album/drift_album_option.widget.dart';

import '../../../widget_tester_extensions.dart';

void main() {
  group('DriftRemoteAlbumOption', () {
    testWidgets('shows kebab menu icon button', (tester) async {
      await tester.pumpConsumerWidget(
        const DriftRemoteAlbumOption(),
      );

      expect(find.byIcon(Icons.more_vert_rounded), findsOneWidget);
    });

    testWidgets('opens menu when icon button is tapped', (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.edit), findsOneWidget);
    });

    testWidgets('shows edit album option when onEditAlbum is provided',
        (tester) async {
      bool editCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () => editCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.edit), findsOneWidget);

      await tester.tap(find.byIcon(Icons.edit));
      await tester.pumpAndSettle();

      expect(editCalled, isTrue);
    });

    testWidgets('hides edit album option when onEditAlbum is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onAddPhotos: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.edit), findsNothing);
    });

    testWidgets('shows add photos option when onAddPhotos is provided',
        (tester) async {
      bool addPhotosCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onAddPhotos: () => addPhotosCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.add_a_photo), findsOneWidget);

      await tester.tap(find.byIcon(Icons.add_a_photo));
      await tester.pumpAndSettle();

      expect(addPhotosCalled, isTrue);
    });

    testWidgets('hides add photos option when onAddPhotos is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.add_a_photo), findsNothing);
    });

    testWidgets('shows add users option when onAddUsers is provided',
        (tester) async {
      bool addUsersCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onAddUsers: () => addUsersCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.group_add), findsOneWidget);

      await tester.tap(find.byIcon(Icons.group_add));
      await tester.pumpAndSettle();

      expect(addUsersCalled, isTrue);
    });

    testWidgets('hides add users option when onAddUsers is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.group_add), findsNothing);
    });

    testWidgets('shows leave album option when onLeaveAlbum is provided',
        (tester) async {
      bool leaveAlbumCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onLeaveAlbum: () => leaveAlbumCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.person_remove_rounded), findsOneWidget);

      await tester.tap(find.byIcon(Icons.person_remove_rounded));
      await tester.pumpAndSettle();

      expect(leaveAlbumCalled, isTrue);
    });

    testWidgets('hides leave album option when onLeaveAlbum is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.person_remove_rounded), findsNothing);
    });

    testWidgets(
        'shows toggle album order option when onToggleAlbumOrder is provided',
        (tester) async {
      bool toggleOrderCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onToggleAlbumOrder: () => toggleOrderCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.swap_vert_rounded), findsOneWidget);

      await tester.tap(find.byIcon(Icons.swap_vert_rounded));
      await tester.pumpAndSettle();

      expect(toggleOrderCalled, isTrue);
    });

    testWidgets('hides toggle album order option when onToggleAlbumOrder is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.swap_vert_rounded), findsNothing);
    });

    testWidgets(
        'shows create shared link option when onCreateSharedLink is provided',
        (tester) async {
      bool createSharedLinkCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onCreateSharedLink: () => createSharedLinkCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.link), findsOneWidget);

      await tester.tap(find.byIcon(Icons.link));
      await tester.pumpAndSettle();

      expect(createSharedLinkCalled, isTrue);
    });

    testWidgets('hides create shared link option when onCreateSharedLink is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.link), findsNothing);
    });

    testWidgets('shows options option when onShowOptions is provided',
        (tester) async {
      bool showOptionsCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onShowOptions: () => showOptionsCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.settings), findsOneWidget);

      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      expect(showOptionsCalled, isTrue);
    });

    testWidgets('hides options option when onShowOptions is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.settings), findsNothing);
    });

    testWidgets('shows delete album option when onDeleteAlbum is provided',
        (tester) async {
      bool deleteAlbumCalled = false;

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onDeleteAlbum: () => deleteAlbumCalled = true,
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.delete), findsOneWidget);

      await tester.tap(find.byIcon(Icons.delete));
      await tester.pumpAndSettle();

      expect(deleteAlbumCalled, isTrue);
    });

    testWidgets('hides delete album option when onDeleteAlbum is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.delete), findsNothing);
    });

    testWidgets('shows divider before delete album option', (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
          onDeleteAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byType(Divider), findsOneWidget);
    });

    testWidgets('shows all options when all callbacks are provided',
        (tester) async {
      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          onEditAlbum: () {},
          onAddPhotos: () {},
          onAddUsers: () {},
          onLeaveAlbum: () {},
          onToggleAlbumOrder: () {},
          onCreateSharedLink: () {},
          onShowOptions: () {},
          onDeleteAlbum: () {},
        ),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.edit), findsOneWidget);
      expect(find.byIcon(Icons.add_a_photo), findsOneWidget);
      expect(find.byIcon(Icons.group_add), findsOneWidget);
      expect(find.byIcon(Icons.person_remove_rounded), findsOneWidget);
      expect(find.byIcon(Icons.swap_vert_rounded), findsOneWidget);
      expect(find.byIcon(Icons.link), findsOneWidget);
      expect(find.byIcon(Icons.settings), findsOneWidget);
      expect(find.byIcon(Icons.delete), findsOneWidget);
      expect(find.byType(Divider), findsOneWidget);
    });

    testWidgets('shows no options when all callbacks are null', (tester) async {
      await tester.pumpConsumerWidget(
        const DriftRemoteAlbumOption(),
      );

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.edit), findsNothing);
      expect(find.byIcon(Icons.add_a_photo), findsNothing);
      expect(find.byIcon(Icons.group_add), findsNothing);
      expect(find.byIcon(Icons.person_remove_rounded), findsNothing);
      expect(find.byIcon(Icons.swap_vert_rounded), findsNothing);
      expect(find.byIcon(Icons.link), findsNothing);
      expect(find.byIcon(Icons.settings), findsNothing);
      expect(find.byIcon(Icons.delete), findsNothing);
    });

    testWidgets('uses custom icon color when provided', (tester) async {
      const customColor = Colors.red;

      await tester.pumpConsumerWidget(
        const DriftRemoteAlbumOption(
          iconColor: customColor,
        ),
      );

      final iconButton = tester.widget<IconButton>(find.byType(IconButton));
      final icon = iconButton.icon as Icon;

      expect(icon.color, equals(customColor));
    });

    testWidgets('uses default white color when iconColor is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        const DriftRemoteAlbumOption(),
      );

      final iconButton = tester.widget<IconButton>(find.byType(IconButton));
      final icon = iconButton.icon as Icon;

      expect(icon.color, equals(Colors.white));
    });

    testWidgets('applies icon shadows when provided', (tester) async {
      final shadows = [
        const Shadow(offset: Offset(0, 2), blurRadius: 5, color: Colors.black),
      ];

      await tester.pumpConsumerWidget(
        DriftRemoteAlbumOption(
          iconShadows: shadows,
        ),
      );

      final iconButton = tester.widget<IconButton>(find.byType(IconButton));
      final icon = iconButton.icon as Icon;

      expect(icon.shadows, equals(shadows));
    });

    group('owner vs non-owner scenarios', () {
      testWidgets('owner sees all management options', (tester) async {
        // Simulating owner scenario - all callbacks provided
        await tester.pumpConsumerWidget(
          DriftRemoteAlbumOption(
            onEditAlbum: () {},
            onAddPhotos: () {},
            onAddUsers: () {},
            onToggleAlbumOrder: () {},
            onCreateSharedLink: () {},
            onShowOptions: () {},
            onDeleteAlbum: () {},
          ),
        );

        await tester.tap(find.byIcon(Icons.more_vert_rounded));
        await tester.pumpAndSettle();

        // Owner should see all management options
        expect(find.byIcon(Icons.edit), findsOneWidget);
        expect(find.byIcon(Icons.add_a_photo), findsOneWidget);
        expect(find.byIcon(Icons.group_add), findsOneWidget);
        expect(find.byIcon(Icons.swap_vert_rounded), findsOneWidget);
        expect(find.byIcon(Icons.link), findsOneWidget);
        expect(find.byIcon(Icons.delete), findsOneWidget);
        // Owner should NOT see leave album
        expect(find.byIcon(Icons.person_remove_rounded), findsNothing);
      });

      testWidgets('non-owner with editor role sees limited options',
          (tester) async {
        // Simulating non-owner with editor role - can add photos, show options, leave
        await tester.pumpConsumerWidget(
          DriftRemoteAlbumOption(
            onAddPhotos: () {},
            onShowOptions: () {},
            onLeaveAlbum: () {},
          ),
        );

        await tester.tap(find.byIcon(Icons.more_vert_rounded));
        await tester.pumpAndSettle();

        // Editor can add photos
        expect(find.byIcon(Icons.add_a_photo), findsOneWidget);
        // Can see options
        expect(find.byIcon(Icons.settings), findsOneWidget);
        // Can leave album
        expect(find.byIcon(Icons.person_remove_rounded), findsOneWidget);
        // Cannot see owner-only options
        expect(find.byIcon(Icons.edit), findsNothing);
        expect(find.byIcon(Icons.group_add), findsNothing);
        expect(find.byIcon(Icons.swap_vert_rounded), findsNothing);
        expect(find.byIcon(Icons.link), findsNothing);
        expect(find.byIcon(Icons.delete), findsNothing);
      });

      testWidgets('non-owner viewer sees minimal options', (tester) async {
        // Simulating viewer - can only show options and leave
        await tester.pumpConsumerWidget(
          DriftRemoteAlbumOption(
            onShowOptions: () {},
            onLeaveAlbum: () {},
          ),
        );

        await tester.tap(find.byIcon(Icons.more_vert_rounded));
        await tester.pumpAndSettle();

        // Can see options
        expect(find.byIcon(Icons.settings), findsOneWidget);
        // Can leave album
        expect(find.byIcon(Icons.person_remove_rounded), findsOneWidget);
        // Cannot see any other options
        expect(find.byIcon(Icons.edit), findsNothing);
        expect(find.byIcon(Icons.add_a_photo), findsNothing);
        expect(find.byIcon(Icons.group_add), findsNothing);
        expect(find.byIcon(Icons.swap_vert_rounded), findsNothing);
        expect(find.byIcon(Icons.link), findsNothing);
        expect(find.byIcon(Icons.delete), findsNothing);
      });
    });
  });
}
