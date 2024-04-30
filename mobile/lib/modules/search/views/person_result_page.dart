import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';
import 'package:immich_mobile/modules/search/ui/person_name_edit_form.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/shared/ui/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

@RoutePage()
class PersonResultPage extends HookConsumerWidget {
  final String personId;
  final String personName;

  const PersonResultPage({
    super.key,
    required this.personId,
    required this.personName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = useState(personName);

    showEditNameDialog() {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return PersonNameEditForm(
            personId: personId,
            personName: name.value,
          );
        },
      ).then((result) {
        if (result != null && result.success) {
          name.value = result.updatedName;
        }
      });
    }

    void buildBottomSheet() {
      showModalBottomSheet(
        backgroundColor: context.scaffoldBackgroundColor,
        isScrollControlled: false,
        context: context,
        useSafeArea: true,
        builder: (context) {
          return SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: const Text(
                    'search_page_person_edit_name',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ).tr(),
                  onTap: showEditNameDialog,
                ),
              ],
            ),
          );
        },
      );
    }

    buildTitleBlock() {
      return GestureDetector(
        onTap: showEditNameDialog,
        child: name.value.isEmpty
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'search_page_person_add_name_title',
                    style: context.textTheme.titleMedium?.copyWith(
                      color: context.primaryColor,
                    ),
                  ).tr(),
                  Text(
                    'search_page_person_add_name_subtitle',
                    style: context.textTheme.labelLarge,
                  ).tr(),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name.value,
                    style: context.textTheme.titleLarge,
                  ),
                ],
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(name.value),
        leading: IconButton(
          onPressed: () => context.popRoute(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        actions: [
          IconButton(
            onPressed: buildBottomSheet,
            icon: const Icon(Icons.more_vert_rounded),
          ),
        ],
      ),
      body: MultiselectGrid(
        renderListProvider: personAssetsProvider(personId),
        topWidget: Padding(
          padding: const EdgeInsets.only(left: 8.0, top: 24),
          child: Row(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundImage: NetworkImage(
                  getFaceThumbnailUrl(personId),
                  headers: {
                    "x-immich-user-token": Store.get(StoreKey.accessToken),
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16.0),
                child: buildTitleBlock(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
