import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/search/person_name_edit_form.dart';

@RoutePage()
class PeopleCollectionPage extends HookConsumerWidget {
  const PeopleCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(getAllPeopleProvider);
    final headers = ApiService.getRequestHeaders();

    showNameEditModel(
      String personId,
      String personName,
    ) {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          return PersonNameEditForm(personId: personId, personName: personName);
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('people'.tr()),
      ),
      body: people.when(
        data: (people) {
          return GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 0.85,
            ),
            padding: const EdgeInsets.symmetric(vertical: 32),
            itemCount: people.length,
            itemBuilder: (context, index) {
              final person = people[index];

              return Column(
                children: [
                  GestureDetector(
                    onTap: () {
                      context.pushRoute(
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
                        maxRadius: 96 / 2,
                        backgroundImage: NetworkImage(
                          getFaceThumbnailUrl(person.id),
                          headers: headers,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => showNameEditModel(person.id, person.name),
                    child: person.name.isEmpty
                        ? Text(
                            'add_a_name'.tr(),
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
              );
            },
          );
        },
        error: (error, stack) => const Text("error"),
        loading: () => const CircularProgressIndicator(),
      ),
    );
  }
}
