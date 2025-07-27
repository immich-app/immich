import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/widgets/search/person_name_edit_form.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:fluttertoast/fluttertoast.dart';

@RoutePage()
class PersonResultPage extends HookConsumerWidget {
  final String personId;
  final String personName;
  final bool isFavorite;

  const PersonResultPage({
    super.key,
    required this.personId,
    required this.personName,
    required this.isFavorite,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = useState(personName);
    final favoriteStatus = useState(isFavorite);
    final isTogglingFavorite = useState(false);

    showEditNameDialog() {
      showDialog(
        context: context,
        useRootNavigator: false,
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

    toggleFavorite() async {
      if (isTogglingFavorite.value) return; // Prevent multiple calls
      
      isTogglingFavorite.value = true;
      try {
        final success = await ref.read(togglePersonFavoriteProvider(personId, favoriteStatus.value).future);
        if (success == true) {
          favoriteStatus.value = !favoriteStatus.value;
          if (context.mounted) {
            final message = favoriteStatus.value 
              ? 'Person added to favorites' 
              : 'Person removed from favorites';
            ImmichToast.show(
              context: context,
              msg: message,
              toastType: ToastType.success,
              gravity: ToastGravity.BOTTOM,
            );
          }
        } else {
          if (context.mounted) {
            ImmichToast.show(
              context: context,
              msg: 'Failed to toggle favorite status',
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
          }
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: 'Error toggling favorite: ${e.toString()}',
            toastType: ToastType.error,
            gravity: ToastGravity.BOTTOM,
          );
        }
        debugPrint('Error toggling favorite: $e');
      } finally {
        isTogglingFavorite.value = false;
      }
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
                    'edit_name',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ).tr(),
                  onTap: showEditNameDialog,
                ),
                ListTile(
                  leading: isTogglingFavorite.value 
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : (favoriteStatus.value ? const Icon(Icons.favorite) : const Icon(Icons.favorite_border)),
                  title: Text(
                    favoriteStatus.value ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ).tr(),
                  onTap: isTogglingFavorite.value ? null : () {
                    Navigator.of(context).pop();
                    toggleFavorite();
                  },
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
                    'add_a_name',
                    style: context.textTheme.titleMedium?.copyWith(
                      color: context.primaryColor,
                    ),
                  ).tr(),
                  Text(
                    'find_them_fast',
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
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(name.value),
        leading: IconButton(
          onPressed: () => context.maybePop(),
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
                  headers: ApiService.getRequestHeaders(),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 16.0, right: 16.0),
                  child: buildTitleBlock(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
