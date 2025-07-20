import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/partner_detail_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';

@RoutePage()
class DriftPartnerDetailPage extends StatelessWidget {
  final UserDto partner;

  const DriftPartnerDetailPage({
    super.key,
    required this.partner,
  });

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineService =
                ref.watch(timelineFactoryProvider).remoteAssets(partner.id);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          },
        ),
      ],
      child: Timeline(
        appBar: MesmerizingSliverAppBar(
          title: partner.name,
          icon: Icons.person_outline,
        ),
        topSliverWidget: _InfoBox(
          onTap: () => {
            // TODO: Create DriftUserProvider/DriftUserService to handle this action
          },
          inTimeline: partner.inTimeline,
        ),
        topSliverWidgetHeight: 110,
        bottomSheet: const PartnerDetailBottomSheet(),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  final VoidCallback onTap;
  final bool inTimeline;

  const _InfoBox({
    required this.onTap,
    required this.inTimeline,
  });

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 110,
        child: Padding(
          padding: const EdgeInsets.only(left: 8.0, right: 8.0, top: 16.0),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(
                color: context.colorScheme.onSurface.withAlpha(10),
                width: 1,
              ),
              borderRadius: const BorderRadius.all(
                Radius.circular(20),
              ),
              gradient: LinearGradient(
                colors: [
                  context.colorScheme.primary.withAlpha(10),
                  context.colorScheme.primary.withAlpha(15),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: ListTile(
                title: Text(
                  "Show in timeline",
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.primary,
                  ),
                ),
                subtitle: Text(
                  "Show photos and videos from this user in your timeline",
                  style: context.textTheme.bodyMedium,
                ),
                trailing: Switch(
                  value: inTimeline,
                  onChanged: (_) => onTap(),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
