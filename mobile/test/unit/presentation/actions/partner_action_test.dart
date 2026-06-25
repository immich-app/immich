import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/presentation/actions/partner.action.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../factories/user_factory.dart';
import '../../mocks.dart';
import '../../presentation_context.dart';

void main() {
  late PresentationContext context;
  late UserDto currentUser;
  final mocks = ServiceMocks();

  setUp(() async {
    currentUser = UserFactory.createDto();
    context = await PresentationContext.create();
    when(mocks.user.tryGetMyUser).thenReturn(currentUser);
  });

  tearDown(() async {
    mocks.resetAll();
    await context.dispose();
  });

  List<Override> overrides({List<User> candidates = const []}) => [
    currentUserProvider.overrideWith((ref) => CurrentUserProvider(mocks.user.service)),
    partnerServiceProvider.overrideWithValue(mocks.partner.service),
    candidatesStateProvider.overrideWith((ref) => Stream<Iterable<User>>.value(candidates)),
  ];

  group('PartnerAddAction', () {
    testWidgets('creates a partner for the selected candidate', (tester) async {
      final candidate = UserFactory.create();

      await tester.pumpTestAction(const PartnerAddAction(), overrides: overrides(candidates: [candidate]));
      await tester.pumpUntilFound(find.text(candidate.name));
      await tester.tap(find.text(candidate.name));
      await tester.pumpAndSettle();

      verify(() => mocks.partner.service.create(sharedById: currentUser.id, sharedWithId: candidate.id)).called(1);
    });

    testWidgets('creates nothing when the selection dialog is dismissed', (tester) async {
      await tester.pumpTestAction(const PartnerAddAction(), overrides: overrides(candidates: [UserFactory.create()]));
      await tester.sendKeyEvent(LogicalKeyboardKey.escape); // dismiss without selecting
      await tester.pumpAndSettle();

      verifyNever(mocks.partner.create);
    });
  });

  group('PartnerRemoveAction', () {
    testWidgets('deletes the partner after confirmation', (tester) async {
      final partner = UserFactory.create();
      await tester.pumpTestAction(
        PartnerRemoveAction(sharedWithId: partner.id, partnerName: partner.name),
        overrides: overrides(),
      );
      await tester.tap(find.byType(TextButton).last); // confirm
      await tester.pumpAndSettle();

      verify(() => mocks.partner.service.delete(sharedById: currentUser.id, sharedWithId: partner.id)).called(1);
    });

    testWidgets('deletes nothing when the confirmation is cancelled', (tester) async {
      final partner = UserFactory.create();
      await tester.pumpTestAction(
        PartnerRemoveAction(sharedWithId: partner.id, partnerName: partner.name),
        overrides: overrides(),
      );
      await tester.tap(find.byType(TextButton).first); // cancel
      await tester.pumpAndSettle();

      verifyNever(mocks.partner.delete);
    });
  });
}
