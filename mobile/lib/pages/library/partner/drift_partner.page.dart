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
final candidatesProvider = StreamProvider.autoDispose<Iterable<User>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  // TODO: Refactor with a route guard to avoid this check in every provider
  if (currentUser == null) {
    return const Stream.empty();
  }
  return ref.watch(partnerServiceProvider).getCandidates(currentUser.id);
});

@visibleForTesting
final partnersProvider = StreamProvider.autoDispose<Iterable<Partner>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  // TODO: Refactor with a route guard to avoid this check in every provider
  if (currentUser == null) {
    return const Stream.empty();
  }

  return ref.watch(partnerServiceProvider).search(currentUser.id, .sharedBy);
});

@RoutePage()
class DriftPartnerPage extends ConsumerWidget {
  const DriftPartnerPage({super.key});

  Future<void> _addPartner(BuildContext context, WidgetRef ref) async {
    final selected = await showDialog<User>(context: context, builder: (_) => const PartnerSelectionDialog());
    final currentUser = ref.read(currentUserProvider);
    if (selected != null && currentUser != null) {
      await ref.read(partnerServiceProvider).create(selected.id, currentUser.id);
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
          ref.read(partnerServiceProvider).delete(partner.id, currentUser.id);
        }
      },
    ),
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedByAsync = ref.watch(partnersProvider);

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
          onAddPartner: () => _addPartner(context, ref),
          onRemovePartner: (partner) => _removePartner(context, ref, partner),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(context.t.error_loading_partners(error: error))),
      ),
    );
  }
}

@visibleForTesting
class PartnerSharedByList extends StatelessWidget {
  const PartnerSharedByList({
    super.key,
    required this.partners,
    required this.onAddPartner,
    required this.onRemovePartner,
  });

  final List<Partner> partners;
  final VoidCallback onAddPartner;
  final ValueChanged<Partner> onRemovePartner;

  @override
  Widget build(BuildContext context) {
    if (partners.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(context.t.partner_page_empty_message, style: const TextStyle(fontSize: 14)),
            ),
            Align(
              alignment: Alignment.center,
              child: ElevatedButton.icon(
                onPressed: onAddPartner,
                icon: const Icon(Icons.person_add),
                label: Text(context.t.add_partner),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: partners.length,
      itemBuilder: (_, index) {
        final partner = partners[index];
        return ListTile(
          leading: PartnerUserAvatar(userId: partner.id, name: partner.name),
          title: Text(partner.name),
          subtitle: Text(partner.email),
          trailing: IconButton(icon: const Icon(Icons.person_remove), onPressed: () => onRemovePartner(partner)),
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
    final candidatesAsync = ref.watch(candidatesProvider);

    return SimpleDialog(
      title: const Text("partner_page_select_partner").tr(),
      children: candidatesAsync.when(
        data: (candidates) {
          final users = candidates.toList();
          if (users.isEmpty) {
            return [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
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
                      padding: const EdgeInsets.only(right: 8),
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
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
        ],
        error: (error, _) => [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Text("error_loading_partners".tr(args: [error.toString()])),
          ),
        ],
      ),
    );
  }
}
