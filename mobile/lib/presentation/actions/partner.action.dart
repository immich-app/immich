import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/widgets/people/partner_user_avatar.widget.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

class PartnerAddAction extends BaseAction {
  const PartnerAddAction() : super(icon: Icons.person_add_rounded);

  @override
  String label(BuildContext context) => context.t.add_partner;

  @override
  bool isVisible(BuildContext context, WidgetRef ref) => true;

  @override
  Future<void> onAction(BuildContext context, WidgetRef ref) async {
    final selected = await showDialog<User>(context: context, builder: (_) => const PartnerSelectionDialog());
    final currentUser = ref.read(currentUserProvider);
    if (selected == null || currentUser == null) {
      return;
    }

    await ref.read(partnerServiceProvider).create(sharedById: currentUser.id, sharedWithId: selected.id);
  }
}

class PartnerRemoveAction extends BaseAction {
  const PartnerRemoveAction({required this.sharedWithId, required this.partnerName})
    : super(icon: Icons.person_remove_rounded);

  final String sharedWithId;
  final String partnerName;

  @override
  String label(BuildContext context) => context.t.remove;

  @override
  bool isVisible(BuildContext context, WidgetRef ref) => true;

  @override
  Future<void> onAction(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => ConfirmDialog(
        title: context.t.stop_photo_sharing,
        content: context.t.partner_page_stop_sharing_content(partner: partnerName),
      ),
    );
    final currentUser = ref.read(currentUserProvider);
    if (confirmed != true || currentUser == null) {
      return;
    }

    await ref.read(partnerServiceProvider).delete(sharedById: currentUser.id, sharedWithId: sharedWithId);
  }
}

@visibleForTesting
class PartnerSelectionDialog extends ConsumerWidget {
  const PartnerSelectionDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final candidatesAsync = ref.watch(candidatesStateProvider);

    return SimpleDialog(
      title: Text(context.t.partner_page_select_partner),
      children: candidatesAsync.when(
        data: (candidates) {
          final users = candidates.toList();
          if (users.isEmpty) {
            return [
              Padding(
                padding: const .symmetric(horizontal: 24, vertical: 8),
                child: Text(context.t.partner_page_no_more_users),
              ),
            ];
          }
          return [
            for (final candidate in users)
              SimpleDialogOption(
                onPressed: () => Navigator.of(context).pop(candidate),
                child: Row(
                  children: [
                    Padding(
                      padding: const .only(right: 8),
                      child: PartnerUserAvatar(userId: candidate.id, name: candidate.name),
                    ),
                    Text(candidate.name),
                  ],
                ),
              ),
          ];
        },
        loading: () => const [
          Padding(
            padding: .all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
        ],
        error: (error, _) => [
          Padding(
            padding: const .symmetric(horizontal: 24, vertical: 8),
            child: Text(context.t.error_loading_partners(error: error)),
          ),
        ],
      ),
    );
  }
}

@visibleForTesting
final candidatesStateProvider = StreamProvider.autoDispose<Iterable<User>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  // TODO: Refactor with a route guard to avoid this check in every provider
  if (currentUser == null) {
    return const Stream.empty();
  }
  return ref.watch(partnerServiceProvider).getCandidates(currentUser.id);
});
