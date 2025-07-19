import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/person.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/widgets/search/person_name_edit_form.dart';

@RoutePage()
class DriftPeoplePage extends StatelessWidget {
  const DriftPeoplePage({super.key});

  @override
  Widget build(BuildContext context) {
    final ValueNotifier<String?> search = ValueNotifier(null);

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isTablet = constraints.maxWidth > 600;
          final isPortrait = context.orientation == Orientation.portrait;

          return CustomScrollView(
            slivers: [
              _PeopleSliverAppBar(search: search),
              _PeopleGrid(
                search: search,
                isTablet: isTablet,
                isPortrait: isPortrait,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PeopleSliverAppBar extends StatelessWidget {
  const _PeopleSliverAppBar({required this.search});

  final ValueNotifier<String?> search;

  @override
  Widget build(BuildContext context) {
    final searchFocusNode = FocusNode();

    return SliverAppBar(
      floating: true,
      pinned: true,
      snap: false,
      backgroundColor: context.colorScheme.surfaceContainer,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(5)),
      ),
      automaticallyImplyLeading: search.value == null,
      centerTitle: true,
      title: search.value != null
          ? SearchField(
              focusNode: searchFocusNode,
              onTapOutside: (_) => searchFocusNode.unfocus(),
              onChanged: (value) => search.value = value,
              filled: true,
              hintText: 'filter_people'.t(context: context),
              autofocus: true,
            )
          : Text('people'.t(context: context)),
      actions: [
        IconButton(
          icon: Icon(search.value != null ? Icons.close : Icons.search),
          onPressed: () {
            search.value = search.value == null ? '' : null;
          },
        ),
      ],
    );
  }
}

class _PeopleGrid extends ConsumerWidget {
  const _PeopleGrid({
    required this.search,
    required this.isTablet,
    required this.isPortrait,
  });

  final ValueNotifier<String?> search;
  final bool isTablet;
  final bool isPortrait;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) {
      throw Exception('User must be logged in to access people');
    }

    final people = ref.watch(personProvider(user.id));

    // TODO: migrate to new modal widget and update name in SQLite
    showNameEditModel(
      String personId,
      String personName,
    ) {
      return showDialog(
        context: context,
        useRootNavigator: false,
        builder: (BuildContext context) {
          return PersonNameEditForm(personId: personId, personName: personName);
        },
      );
    }

    return SliverSafeArea(
      sliver: people.when(
        loading: () => const SliverToBoxAdapter(
          child: Center(
            child: Padding(
              padding: EdgeInsets.all(20.0),
              child: CircularProgressIndicator(),
            ),
          ),
        ),
        error: (error, stack) => SliverToBoxAdapter(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Text(
                'Error loading people: $error, stack: $stack',
                style: TextStyle(
                  color: context.colorScheme.error,
                ),
              ),
            ),
          ),
        ),
        data: (people) {
          if (search.value != null) {
            people = people
                .where(
                  (person) => person.name
                      .toLowerCase()
                      .contains(search.value!.toLowerCase()),
                )
                .toList();
          }

          return SliverGrid.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isTablet ? 6 : 3,
              childAspectRatio: 0.85,
              mainAxisSpacing: isPortrait && isTablet ? 36 : 0,
            ),
            itemCount: people.length,
            itemBuilder: (context, index) {
              final person = people[index];

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: () {
                        context.pushRoute(
                          // TODO: migrate to drift after face sync
                          PersonResultRoute(
                            personId: person.id,
                            personName: person.name,
                          ),
                        );
                      },
                      child: Material(
                        shape: const CircleBorder(side: BorderSide.none),
                        elevation: 3,
                        child: CircleAvatar(
                          maxRadius: isTablet ? 120 / 2 : 96 / 2,
                          // TODO: migrate to face asset id after face sync
                          backgroundImage: NetworkImage(
                            getFaceThumbnailUrl(person.id),
                            headers: ApiService.getRequestHeaders(),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: () => showNameEditModel(person.id, person.name),
                      child: person.name.isEmpty
                          ? Text(
                              'add_a_name'.t(context: context),
                              style: context.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w500,
                                color: context.colorScheme.primary,
                              ),
                            )
                          : Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16.0),
                              child: Text(
                                person.name,
                                overflow: TextOverflow.ellipsis,
                                style: context.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
