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
class DriftPersonPage extends ConsumerStatefulWidget {
  final DriftPerson initialPerson;

  const DriftPersonPage(this.initialPerson, {super.key});

  @override
  ConsumerState<DriftPersonPage> createState() => _DriftPersonPageState();
}

class _DriftPersonPageState extends ConsumerState<DriftPersonPage> {
  late DriftPerson _person;

  @override
  void initState() {
    super.initState();
    _person = widget.initialPerson;
  }

  Future<bool> handleEditName(BuildContext context) async {
    final result = await showNameEditModal(context, _person);

    // result is not null && different person => merge occurred
    if (result != null && result.id != _person.id && mounted) {
      setState(() => _person = result);

      await this.context.replaceRoute(DriftPersonRoute(initialPerson: result));
      return true;
    }
    return false;
  }

  Future<void> handleEditBirthday(BuildContext context) async {
    await showBirthdayEditModal(context, _person);
  }

  void showOptionSheet(BuildContext context) {
    showModalBottomSheet(
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
    final personAsync = ref.watch(driftGetPersonByIdProvider(_person.id));
    ref.watch(currentRouteNameProvider.select((name) => name ?? DriftPersonRoute.name));

    return personAsync.when(
      data: (personByIdProvider) {
        if (personByIdProvider == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              final currentRoute = AutoRouter.of(context).current;
              // Check if we are currently on the DriftPersonRoute that corresponds to the deleted _person
              if (currentRoute.name == DriftPersonRoute.name &&
                  (currentRoute.args is DriftPersonRouteArgs &&
                      (currentRoute.args as DriftPersonRouteArgs).initialPerson.id == _person.id)) {
                AutoRouter.of(context).replace(const DriftPeopleCollectionRoute());
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
