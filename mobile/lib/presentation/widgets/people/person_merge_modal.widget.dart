import 'dart:async';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class PersonMergeForm extends ConsumerStatefulWidget {
  final Person person;
  final Person mergeTarget;

  const PersonMergeForm({super.key, required this.person, required this.mergeTarget});

  @override
  ConsumerState<PersonMergeForm> createState() => _PersonMergeFormState();
}

class _PersonMergeFormState extends ConsumerState<PersonMergeForm> {
  bool _isMerging = false;

  Future<void> _mergePeople() async {
    setState(() => _isMerging = true);
    try {
      final mergedIds = await ref
          .read(peopleServiceProvider)
          .merge(targetPersonId: widget.mergeTarget.id, mergePersonIds: [widget.person.id]);

      if (!mounted) {
        return;
      }

      if (mergedIds.isEmpty) {
        setState(() => _isMerging = false);
        ImmichToast.show(
          context: context,
          msg: context.t.cannot_merge_people,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
        );
        return;
      }

      ref.invalidate(getAllPeopleProvider);
      Navigator.of(context).pop(widget.mergeTarget);
      ImmichToast.show(
        context: context,
        msg: context.t.merge_people_successfully,
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.success,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isMerging = false);
        ImmichToast.show(
          context: context,
          msg: context.t.error_title,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(context.t.merge_people, style: const TextStyle(fontWeight: FontWeight.bold)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(widget.person.id)),
              ),
              const SizedBox(width: 16),
              const RotatedBox(quarterTurns: 1, child: Icon(Icons.merge_type, size: 32)),
              const SizedBox(width: 16),
              CircleAvatar(
                radius: 32,
                backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(widget.mergeTarget.id)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            context.t.are_these_the_same_person,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            context.t.they_will_be_merged_together,
            style: TextStyle(fontSize: 14, color: Theme.of(context).textTheme.bodyMedium?.color),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.onSurface,
                    foregroundColor: Theme.of(context).colorScheme.onInverseSurface,
                    elevation: 0,
                  ),
                  onPressed: _isMerging ? null : () => Navigator.of(context).pop(),
                  child: Text(context.t.no, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Theme.of(context).colorScheme.onPrimary,
                  ),
                  onPressed: _isMerging ? null : () => unawaited(_mergePeople()),
                  child: _isMerging
                      ? SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Theme.of(context).colorScheme.onPrimary,
                          ),
                        )
                      : Text(context.t.yes, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
