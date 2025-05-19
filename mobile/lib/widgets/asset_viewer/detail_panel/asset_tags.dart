import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';
import 'package:openapi/api.dart';

class AssetTags extends ConsumerWidget {
  final Asset asset;

  const AssetTags({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetWithTags = ref.watch(assetDetailProvider(asset));
    final List<TagResponseDto> tags = (assetWithTags.value ?? asset).tags ?? [];

    final List<Widget> tagComponents = [];

    void tagLookup(TagResponseDto tag) {
      print("lookup: " + tag.value);
    }

    void untagAsset(TagResponseDto tag) {
      handleRemoveAssetTags(ref, context, [asset], [tag]);
    }

    void tagAsset() async {
      await handleEditAssetTags(ref, context, [asset]);
    }

    for (TagResponseDto tag in tags) {
      final tagChip = InputChip(
        label: Text(tag.value),
        deleteIcon: const Icon(Icons.close),
        onDeleted: () => untagAsset(tag),
        onPressed: () => tagLookup(tag),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
      );
      tagComponents.add(tagChip);
    }

    var addTagChip = InputChip(
      avatar: const Icon(Icons.add),
      label: const Text("Add"),
      onPressed: () => tagAsset(),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(20)),
      ),
    );
    tagComponents.add(addTagChip);

    return Padding(
      padding: const EdgeInsets.only(top: 24.0),
      child: Align(
        alignment: Alignment.topLeft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "TAGS",
              style: context.textTheme.labelMedium?.copyWith(
                color: context.textTheme.labelMedium?.color?.withAlpha(200),
                fontWeight: FontWeight.w600,
              ),
            ).tr(),
            Wrap(
              spacing: 1,
              runSpacing: 1,
              children: tagComponents,
            ),
          ],
        ),
      ),
    );
  }
}
