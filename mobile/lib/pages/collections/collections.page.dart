import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';

@RoutePage()
class CollectionsPage extends StatelessWidget {
  const CollectionsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const ImmichAppBar(
        action: CreateNewButton(),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ListView(
          shrinkWrap: true,
          children: [
            Row(
              children: [
                ActionButton(
                  onPressed: () {},
                  icon: Icons.favorite_outline_rounded,
                  label: 'Favorite',
                ),
                const SizedBox(width: 8),
                ActionButton(
                  onPressed: () {},
                  icon: Icons.delete_outline_rounded,
                  label: 'Trash',
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ActionButton(
                  onPressed: () {},
                  icon: Icons.link_outlined,
                  label: 'Shared links',
                ),
                const SizedBox(width: 8),
                ActionButton(
                  onPressed: () {},
                  icon: Icons.archive_outlined,
                  label: 'Archive',
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class ActionButton extends StatelessWidget {
  final VoidCallback onPressed;
  final IconData icon;
  final String label;

  const ActionButton({
    super.key,
    required this.onPressed,
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: FilledButton.icon(
        onPressed: onPressed,
        label: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: Text(
            label,
            style: TextStyle(
              color: context.colorScheme.onSurface,
            ),
          ),
        ),
        style: FilledButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          backgroundColor: context.colorScheme.surfaceContainer,
          alignment: Alignment.centerLeft,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
        ),
        icon: Icon(
          icon,
          color: context.primaryColor,
        ),
      ),
    );
  }
}

class CreateNewButton extends StatelessWidget {
  const CreateNewButton({super.key});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      borderRadius: const BorderRadius.all(Radius.circular(25)),
      child: Icon(
        Icons.add,
        size: 32,
        semanticLabel: 'profile_drawer_trash'.tr(),
      ),
    );
  }
}
