import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/people/partner_user_avatar.widget.dart';
import 'package:immich_mobile/providers/infrastructure/partner.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class DriftPartnerPage extends HookConsumerWidget {
  const DriftPartnerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final potentialPartnersAsync = ref.watch(driftAvailablePartnerProvider);

    addNewUsersHandler() async {
      final potentialPartners = potentialPartnersAsync.value;
      if (potentialPartners == null || potentialPartners.isEmpty) {
        ImmichToast.show(context: context, msg: "partner_page_no_more_users".tr());
        return;
      }

      final selectedUser = await showDialog<PartnerUserDto>(
        context: context,
        builder: (context) {
          return SimpleDialog(
            title: const Text("partner_page_select_partner").tr(),
            children: [
              for (PartnerUserDto partner in potentialPartners)
                SimpleDialogOption(
                  onPressed: () => context.pop(partner),
                  child: Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: PartnerUserAvatar(partner: partner),
                      ),
                      Text(partner.name),
                    ],
                  ),
                ),
            ],
          );
        },
      );
      if (selectedUser != null) {
        await ref.read(partnerUsersProvider.notifier).addPartner(selectedUser);
      }
    }

    onDeleteUser(PartnerUserDto partner) {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          return ConfirmDialog(
            title: "stop_photo_sharing",
            content: "partner_page_stop_sharing_content".tr(namedArgs: {'partner': partner.name}),
            onOk: () => ref.read(partnerUsersProvider.notifier).removePartner(partner),
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("partners").t(context: context),
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: potentialPartnersAsync.whenOrNull(data: (data) => addNewUsersHandler),
            icon: const Icon(Icons.person_add),
            tooltip: "add_partner".tr(),
          ),
        ],
      ),
      body: _SharedToPartnerList(onAddPartner: addNewUsersHandler, onDeletePartner: onDeleteUser),
    );
  }
}

class _SharedToPartnerList extends ConsumerWidget {
  final VoidCallback onAddPartner;
  final Function(PartnerUserDto partner) onDeletePartner;

  const _SharedToPartnerList({required this.onAddPartner, required this.onDeletePartner});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partnerAsync = ref.watch(driftSharedByPartnerProvider);

    return partnerAsync.when(
      data: (partners) {
        if (partners.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: const Text("partner_page_empty_message", style: TextStyle(fontSize: 14)).tr(),
                ),
                Align(
                  alignment: Alignment.center,
                  child: ElevatedButton.icon(
                    onPressed: onAddPartner,
                    icon: const Icon(Icons.person_add),
                    label: const Text("add_partner").tr(),
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          itemCount: partners.length,
          itemBuilder: (context, index) {
            final partner = partners[index];
            return ListTile(
              leading: PartnerUserAvatar(partner: partner),
              title: Text(partner.name),
              subtitle: Text(partner.email),
              trailing: IconButton(icon: const Icon(Icons.person_remove), onPressed: () => onDeletePartner(partner)),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('error_loading_partners'.tr(args: [error.toString()]))),
    );
  }
}
