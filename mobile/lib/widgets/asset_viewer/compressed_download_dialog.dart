import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class CompressedDownloadDialog extends StatefulWidget {
  const CompressedDownloadDialog({super.key});

  @override
  State<CompressedDownloadDialog> createState() => _CompressedDownloadDialogState();
}

class _CompressedDownloadDialogState extends State<CompressedDownloadDialog> {
  static const List<int> _qualityPresets = [90, 75, 50];
  static const int _defaultCustomQuality = 65;

  int? _selectedPreset = _qualityPresets[1];
  bool _useCustomQuality = false;
  double _customQuality = _defaultCustomQuality.toDouble();

  int get _selectedQuality => _useCustomQuality ? _customQuality.round() : (_selectedPreset ?? _qualityPresets[1]);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      title: Text('download_compressed_jpeg'.t(context: context)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'download_compressed_jpeg_description'.t(context: context),
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final quality in _qualityPresets)
                  ChoiceChip(
                    label: Text('$quality%'),
                    selected: !_useCustomQuality && _selectedPreset == quality,
                    onSelected: (_) {
                      setState(() {
                        _useCustomQuality = false;
                        _selectedPreset = quality;
                      });
                    },
                  ),
                ChoiceChip(
                  label: Text('custom'.t(context: context)),
                  selected: _useCustomQuality,
                  onSelected: (_) {
                    setState(() {
                      _useCustomQuality = true;
                    });
                  },
                ),
              ],
            ),
            if (_useCustomQuality) ...[
              const SizedBox(height: 20),
              Text(
                '${'admin.image_quality'.t(context: context)}: $_selectedQuality%',
                style: theme.textTheme.titleSmall,
              ),
              Slider(
                value: _customQuality,
                min: 1,
                max: 100,
                divisions: 99,
                label: '$_selectedQuality%',
                onChanged: (value) {
                  setState(() {
                    _customQuality = value;
                  });
                },
              ),
              Text(
                'download_compressed_jpeg_custom_description'.t(context: context),
                style: theme.textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text('cancel'.t(context: context)),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(_selectedQuality),
          child: Text('download'.t(context: context)),
        ),
      ],
    );
  }
}