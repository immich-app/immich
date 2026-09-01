import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/people/person_option_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/people.utils.dart';
import 'package:immich_mobile/widgets/common/person_sliver_app_bar.dart';

@RoutePage()
class PersonPage extends ConsumerWidget {
  final Person person;

  const PersonPage({super.key, required this.person});

  Future<void> handleEditName(BuildContext context, Person person) async {
    final mergedInto = await showNameEditModal(context, person);
    if (mergedInto != null && context.mounted) {
      await context.replaceRoute(PersonRoute(person: mergedInto));
    }
  }

  Future<void> showOptionSheet(BuildContext context, Person person) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: context.colorScheme.surface,
      isScrollControlled: false,
      builder: (sheetContext) {
        return PersonOptionSheet(
          onEditName: () async {
            ContextHelper(sheetContext).pop();
            await handleEditName(context, person);
          },
          onEditBirthday: () async {
            ContextHelper(sheetContext).pop();
            await showBirthdayEditModal(context, person);
          },
          birthdayExists: person.birthDate != null,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final person = ref.watch(getPersonByIdProvider(this.person.id)).valueOrNull ?? this.person;

    return ProviderScope(
      key: ValueKey(person.id),
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to view person timeline');
          }

          final timelineService = ref.read(timelineFactoryProvider).person(user.id, person.id);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        appBar: PersonSliverAppBar(
          person: person,
          onNameTap: () => handleEditName(context, person),
          onBirthdayTap: () => showBirthdayEditModal(context, person),
          onShowOptions: () => showOptionSheet(context, person),
        ),
      ),
    );
  }
}
