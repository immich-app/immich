import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/tag.action.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';

const _collapsedTagsMaxHeight = 140.0;

class TagDetails extends ConsumerStatefulWidget {
  final BaseAsset asset;

  const TagDetails({super.key, required this.asset});

  @override
  ConsumerState createState() => _TagDetailsState();
}

class _TagDetailsState extends ConsumerState<TagDetails> {
  bool _isExpanded = false;
  bool _hasOverflow = false;

  void _openTag(Tag tag) {
    ref.invalidate(assetViewerProvider);
    ref.invalidate(paginatedSearchProvider);
    ref.read(searchPreFilterProvider.notifier)
      ..clear()
      ..setFilter(
        .new(
          tags: {tag},
          people: {},
          location: const .new(),
          camera: const .new(),
          date: const .new(),
          display: const .new(isNotInAlbum: false, isArchive: false, isFavorite: false),
          rating: const .new(),
          mediaType: .other,
        ),
      );

    unawaited(context.navigateTo(const DriftSearchRoute()));
  }

  bool _onTagsMetrics(ScrollMetricsNotification notification) {
    final hasOverflow = notification.metrics.maxScrollExtent > 0;
    if (hasOverflow != _hasOverflow) {
      setState(() => _hasOverflow = hasOverflow);
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    final tagAction = const TagAction(source: .viewer).create(context, ref);
    final isTagsEnabled = ref.watch(userMetadataPreferencesProvider).valueOrNull?.tagsEnabled ?? false;
    final user = ref.watch(currentUserProvider);
    if (asset is! RemoteAsset || !isTagsEnabled || asset.ownerId != user?.id) {
      return const SizedBox.shrink();
    }

    final tags = ref.watch(assetTagsProvider(asset.id)).valueOrNull ?? const <Tag>[];
    final tagBackground = context.primaryColor.withAlpha(25);
    final tagBorder = context.colorScheme.outlineVariant;
    final tagText = context.colorScheme.onSurface;
    final brandColor = context.primaryColor;
    final chipTheme = context.themeData.copyWith(
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: brandColor.withValues(alpha: 0.15),
    );
    final isCollapsed = !_isExpanded;

    final tagWrap = Theme(
      data: chipTheme,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final tag in tags)
            InputChip(
              onPressed: () => _openTag(tag),
              tooltip: context.t.view_all,
              label: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: context.width * 0.6),
                child: Text(tag.value, overflow: TextOverflow.ellipsis),
              ),
              labelStyle: TextStyle(color: tagText, fontSize: 14, fontWeight: FontWeight.w300),
              backgroundColor: tagBackground,
              shape: const StadiumBorder(),
              side: BorderSide(color: tagBorder),
              deleteIcon: Icon(Icons.close, size: 16, color: tagText),
              onDeleted: () => unawaited(untagAsset(ref, asset.id, tag.id)),
              deleteButtonTooltipMessage: context.t.remove_tag,
            ),
        ],
      ),
    );

    Widget tagArea = isCollapsed
        ? NotificationListener<ScrollMetricsNotification>(
            onNotification: _onTagsMetrics,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: _collapsedTagsMaxHeight),
              child: SingleChildScrollView(physics: const NeverScrollableScrollPhysics(), child: tagWrap),
            ),
          )
        : tagWrap;

    if (isCollapsed && _hasOverflow) {
      tagArea = ShaderMask(
        shaderCallback: (bounds) => const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.white, Colors.white, Colors.transparent],
          stops: [0.0, 0.75, 1.0],
        ).createShader(bounds),
        blendMode: BlendMode.dstIn,
        child: tagArea,
      );
    }

    return Padding(
      padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          Text(
            context.t.tags,
            style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
          tagArea,
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (_hasOverflow)
                ActionChip(
                  label: Text(
                    _isExpanded ? context.t.show_less : context.t.view_more,
                    style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.w500),
                  ),
                  side: BorderSide.none,
                  shape: const StadiumBorder(),
                  backgroundColor: Colors.transparent,
                  onPressed: () => setState(() => _isExpanded = !_isExpanded),
                ),
              if (tagAction != null)
                ActionChip(
                  avatar: Icon(Icons.new_label_outlined, size: 18, color: context.primaryColor),
                  label: Text(context.t.add_tag),
                  color: WidgetStateProperty.resolveWith(
                    (states) =>
                        states.contains(WidgetState.hovered) ? brandColor.withValues(alpha: 0.15) : Colors.transparent,
                  ),
                  onPressed: tagAction.onAction,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
