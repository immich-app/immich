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
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.error,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Error title
              const Text(
                'Initialization Failed',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              
              // Error message
              const Text(
                'Failed to start due to an error during initialization.',
                style: TextStyle(
                  color: Colors.grey,
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
                  color: Colors.grey[900],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Error Details:',
                          style: TextStyle(
                            color: Colors.red,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () async {
                            try {
                              final packageInfo = await PackageInfo.fromPlatform();
                              final appVersion = '${packageInfo.version} build.${packageInfo.buildNumber}';
                              final errorDetails = 'App Version: $appVersion\n\nError: $error\n\nStack Trace:\n$stackTrace';
                              Clipboard.setData(ClipboardData(text: errorDetails)).then((_) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Error details copied to clipboard'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                              });
                            } catch (e) {
                              // Fallback if package info fails
                              final errorDetails = 'Error: $error\n\nStack Trace:\n$stackTrace';
                              Clipboard.setData(ClipboardData(text: errorDetails)).then((_) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Error details copied to clipboard'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                              });
                            }
                          },
                          icon: const Icon(
                            Icons.copy,
                            color: Colors.grey,
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
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(height: 16),
                    ExpansionTile(
                      title: const Text(
                        'Stack Trace',
                        style: TextStyle(
                          color: Colors.orange,
                          fontSize: 12,
                        ),
                      ),
                      tilePadding: EdgeInsets.zero,
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: SingleChildScrollView(
                            child: Text(
                              stackTrace,
                              style: const TextStyle(
                                color: Colors.white,
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
                icon: const Icon(Icons.refresh),
                label: const Text('Restart App'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
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
