import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:package_info_plus/package_info_plus.dart';

class ErrorDisplayScreen extends StatelessWidget {
  final String error;
  final String stackTrace;

  const ErrorDisplayScreen({
    super.key,
    required this.error,
    required this.stackTrace,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App logo with error indicator
              Stack(
                children: [
                  Image.asset(
                    'assets/immich-logo.png',
                    width: 80,
                    height: 80,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.error,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.error,
                        color: theme.colorScheme.onError,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Error title
              Text(
                'Initialization Failed',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              
              // Error message
              Text(
                'Failed to start due to an error during initialization.',
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              
              // Expandable error details
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: theme.colorScheme.error),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Error Details:',
                          style: TextStyle(
                            color: theme.colorScheme.error,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () async {
                            String errorDetails;
                            try {
                              final packageInfo = await PackageInfo.fromPlatform();
                              final appVersion = '${packageInfo.version} build.${packageInfo.buildNumber}';
                              errorDetails = 'App Version: $appVersion\n\nError: $error\n\nStack Trace:\n$stackTrace';
                            } catch (e) {
                              // Fallback if package info fails
                              errorDetails = 'Error: $error\n\nStack Trace:\n$stackTrace';
                            }

                            Clipboard.setData(ClipboardData(text: errorDetails)).then((_) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Error details copied to clipboard'),
                                  backgroundColor: theme.colorScheme.primary,
                                ),
                              );
                            });
                          },
                          icon: Icon(
                            Icons.copy,
                            color: theme.colorScheme.onSurfaceVariant,
                            size: 18,
                          ),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error,
                      style: TextStyle(
                        color: theme.colorScheme.onSurface,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(height: 16),
                    ExpansionTile(
                      title: Text(
                        'Stack Trace',
                        style: TextStyle(
                          color: theme.colorScheme.tertiary,
                          fontSize: 12,
                        ),
                      ),
                      tilePadding: EdgeInsets.zero,
                      iconColor: theme.colorScheme.onSurfaceVariant,
                      collapsedIconColor: theme.colorScheme.onSurfaceVariant,
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: SingleChildScrollView(
                            child: Text(
                              stackTrace,
                              style: TextStyle(
                                color: theme.colorScheme.onSurface,
                                fontSize: 10,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Restart button
              ElevatedButton.icon(
                onPressed: () {
                  // Attempt to restart the app
                  if (Platform.isAndroid || Platform.isIOS) {
                    exit(0);
                  }
                },
                icon: const Icon(Icons.close),
                label: const Text('Close App'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.error,
                  foregroundColor: theme.colorScheme.onError,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
