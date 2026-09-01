import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/people/person_option_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/people.utils.dart';
import 'package:immich_mobile/widgets/common/person_sliver_app_bar.dart';

@RoutePage()
class PersonPage extends ConsumerStatefulWidget {
  final Person person;

  const PersonPage({super.key, required this.person});

  @override
  ConsumerState<PersonPage> createState() => _PersonPageState();
}

class _PersonPageState extends ConsumerState<PersonPage> {
  late Person _person;

  @override
  void initState() {
    super.initState();
    _person = widget.person;
  }

  Future<bool> handleEditName(BuildContext context) async {
    final result = await showNameEditModal(context, _person);

    // result is not null && different person => merge occurred
    if (result != null && result.id != _person.id && mounted) {
      setState(() => _person = result);

      await this.context.replaceRoute(PersonRoute(person: result));
      return true;
    }
    return false;
  }

  Future<void> handleEditBirthday(BuildContext context) async {
    await showBirthdayEditModal(context, _person);
  }

  Future<void> showOptionSheet(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: context.colorScheme.surface,
      isScrollControlled: false,
      builder: (context) {
        return PersonOptionSheet(
          onEditName: () async {
            final isMerge = await handleEditName(context);
            if (!isMerge) {
              ContextHelper(context).pop();
            }
          },
          onEditBirthday: () async {
            await handleEditBirthday(context);
            ContextHelper(context).pop();
          },
          birthdayExists: _person.birthDate != null,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final personAsync = ref.watch(getPersonByIdProvider(_person.id));
    ref.watch(currentRouteNameProvider.select((name) => name ?? PersonRoute.name));

    return personAsync.when(
      data: (personByIdProvider) {
        if (personByIdProvider == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              final currentRoute = AutoRouter.of(context).current;
              final currentArgs = currentRoute.args;
              // Check if we are currently on the PersonRoute that corresponds to the deleted _person
              if (currentRoute.name == PersonRoute.name &&
                  currentArgs is PersonRouteArgs &&
                  currentArgs.person.id == _person.id) {
                unawaited(AutoRouter.of(context).replace(const PeopleCollectionRoute()));
              }
            }
          });
          return const Center(child: CircularProgressIndicator());
        }

        _person = personByIdProvider;
        return ProviderScope(
          key: ValueKey(_person.id),
          overrides: [
            timelineServiceProvider.overrideWith((ref) {
              final user = ref.watch(currentUserProvider);
              if (user == null) {
                throw Exception('User must be logged in to view person timeline');
              }

              final timelineService = ref.read(timelineFactoryProvider).person(user.id, _person.id);
              ref.onDispose(timelineService.dispose);
              return timelineService;
            }),
          ],
          child: Timeline(
            appBar: PersonSliverAppBar(
              person: _person,
              onNameTap: () => handleEditName(context),
              onBirthdayTap: () => handleEditBirthday(context),
              onShowOptions: () => showOptionSheet(context),
            ),
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Text('Error: $e'),
    );
  }
}
