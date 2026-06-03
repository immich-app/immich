import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/people/partner_user_avatar.widget.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

@visibleForTesting
final candidatesStateProvider = StreamProvider.autoDispose<Iterable<User>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  // TODO: Refactor with a route guard to avoid this check in every provider
  if (currentUser == null) {
    return const Stream.empty();
  }
  return ref.watch(partnerServiceProvider).getCandidates(currentUser.id);
});

@visibleForTesting
final partnersStateProvider = StreamProvider.autoDispose<Iterable<Partner>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  // TODO: Refactor with a route guard to avoid this check in every provider
  if (currentUser == null) {
    return const Stream.empty();
  }

  return ref.watch(partnerServiceProvider).search(currentUser.id, .sharedBy);
});

Future<void> _addPartner(BuildContext context, WidgetRef ref) async {
  final selected = await showDialog<User>(context: context, builder: (_) => const PartnerSelectionDialog());
  final currentUser = ref.read(currentUserProvider);
  if (selected != null && currentUser != null) {
    await ref.read(partnerServiceProvider).create(sharedById: currentUser.id, sharedWithId: selected.id);
  }
}

Future<void> _removePartner(BuildContext context, WidgetRef ref, Partner partner) => showDialog(
  context: context,
  builder: (_) => ConfirmDialog(
    title: "stop_photo_sharing",
    content: context.t.partner_page_stop_sharing_content(partner: partner.name),
    onOk: () {
      final currentUser = ref.read(currentUserProvider);
      if (currentUser != null) {
        ref.read(partnerServiceProvider).delete(sharedById: currentUser.id, sharedWithId: partner.id);
      }
    },
  ),
);

@RoutePage()
class PartnerPage extends ConsumerWidget {
  const PartnerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedByAsync = ref.watch(partnersStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.t.partners),
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () => _addPartner(context, ref),
            icon: const Icon(Icons.person_add),
            tooltip: context.t.add_partner,
          ),
        ],
      ),
      body: sharedByAsync.when(
        data: (partners) => PartnerSharedByList(
          partners: partners.toList(growable: false),
          onAdd: () => _addPartner(context, ref),
          onRemove: (partner) => _removePartner(context, ref, partner),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(context.t.error_loading_partners(error: error))),
      ),
    );
  }
}

class _EmptyPartners extends StatelessWidget {
  const _EmptyPartners({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const .symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: .start,
        children: [
          Padding(
            padding: const .symmetric(vertical: 8),
            child: Text(context.t.partner_page_empty_message, style: const TextStyle(fontSize: 14)),
          ),
          Align(
            alignment: .center,
            child: ElevatedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.person_add),
              label: Text(context.t.add_partner),
            ),
          ),
        ],
      ),
    );
  }
}

@visibleForTesting
class PartnerSharedByList extends StatelessWidget {
  const PartnerSharedByList({super.key, required this.partners, required this.onAdd, required this.onRemove});

  final List<Partner> partners;
  final VoidCallback onAdd;
  final ValueChanged<Partner> onRemove;

  @override
  Widget build(BuildContext context) {
    if (partners.isEmpty) {
      return _EmptyPartners(onAdd: onAdd);
    }

    return ListView.builder(
      itemCount: partners.length,
      itemBuilder: (_, index) {
        final partner = partners[index];
        return ListTile(
          leading: PartnerUserAvatar(userId: partner.id, name: partner.name),
          title: Text(partner.name),
          subtitle: Text(partner.email),
          trailing: IconButton(icon: const Icon(Icons.person_remove), onPressed: () => onRemove(partner)),
        );
      },
    );
  }
}

@visibleForTesting
class PartnerSelectionDialog extends ConsumerWidget {
  const PartnerSelectionDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final candidatesAsync = ref.watch(candidatesStateProvider);

    return SimpleDialog(
      title: const Text("partner_page_select_partner").tr(),
      children: candidatesAsync.when(
        data: (candidates) {
          final users = candidates.toList();
          if (users.isEmpty) {
            return [
              Padding(
                padding: const .symmetric(horizontal: 24, vertical: 8),
                child: const Text("partner_page_no_more_users").tr(),
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
