import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/widgets/asset_viewer/asset_album_membership_sheet.dart';

class AddToAlbumActionButton extends ConsumerWidget {
  const AddToAlbumActionButton({
    super.key,
    required this.asset,
    required this.source,
    this.publicOnly = false,
  });

  final BaseAsset asset;
  final ActionSource source;
  final bool publicOnly;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: publicOnly ? Icons.public_outlined : Icons.add_photo_alternate_outlined,
      label: (publicOnly ? 'add_to_public_album' : 'add_to_album').t(context: context),
      onPressed: () => manageAssetAlbumMembership(
        context: context,
        ref: ref,
        asset: asset,
        source: source,
        publicOnly: publicOnly,
      ),
      maxWidth: 110,
    );
  }
}
