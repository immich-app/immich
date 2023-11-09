import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';
import 'package:immich_mobile/modules/search/ui/person_name_edit_form.dart';
import 'package:immich_mobile/shared/models/store.dart' as isar_store;
import 'package:immich_mobile/utils/image_url_builder.dart';

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
      showDialog<PersonNameEditFormResult>(
        context: context,
        builder: (BuildContext context) {
          return PersonNameEditForm(
            personId: personId,
            personName: personName,
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
                    'Edit name',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  onTap: showEditNameDialog,
                ),
              ],
            ),
          );
        },
      );
    }

    buildTitleBlock() {
      if (name.value == "") {
        return GestureDetector(
          onTap: showEditNameDialog,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Add a name',
                style: context.textTheme.titleSmall?.copyWith(
                  color: context.themeData.colorScheme.secondary,
                ),
              ),
              Text(
                'Find them fast by name with search',
                style: context.textTheme.labelSmall,
              ),
            ],
          ),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name.value,
            style: context.textTheme.titleLarge,
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(name.value),
        leading: IconButton(
          onPressed: () => context.autoPop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        actions: [
          IconButton(
            onPressed: buildBottomSheet,
            icon: const Icon(Icons.more_vert_rounded),
          ),
        ],
      ),
      body: ref.watch(personAssetsProvider(personId)).when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => Center(
              child: Text(
                error.toString(),
              ),
            ),
            data: (data) => data.isEmpty
                ? const Center(
                    child: Text('Opps'),
                  )
                : ImmichAssetGrid(
                    renderList: data,
                    topWidget: Padding(
                      padding: const EdgeInsets.only(left: 8.0, top: 24),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundImage: NetworkImage(
                              getFaceThumbnailUrl(personId),
                              headers: {
                                "Authorization":
                                    "Bearer ${isar_store.Store.get(isar_store.StoreKey.accessToken)}",
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
          ),
    );
  }
}
