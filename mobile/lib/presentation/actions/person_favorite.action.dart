import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

class PersonFavoriteAction extends ActionBuilder {
  const PersonFavoriteAction(this.person);

  final Person person;

  @override
  ActionItem create(BuildContext context, WidgetRef ref) {
    final shouldFavorite = !person.isFavorite;
    final message = shouldFavorite ? context.t.added_to_favorites : context.t.removed_from_favorites;
    final toastService = ref.read(toastServiceProvider);

    return .new(
      icon: shouldFavorite ? Icons.favorite_border_rounded : Icons.favorite_rounded,
      label: shouldFavorite ? context.t.favorite : context.t.unfavorite,
      onAction: () async {
        try {
          await ref.read(Store.people).updateFavorite(person.id, shouldFavorite);
          toastService.success(message);
        } catch (error, stack) {
          handleError(error, stack: stack, description: 'Failed to update favorite status for person');
        }
      },
    );
  }
}
