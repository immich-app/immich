import 'package:package_info_plus/package_info_plus.dart';

class PackageInfoSingleton {
  static PackageInfoSingleton? _instance;
  static PackageInfoSingleton get instance {
    _instance ??= PackageInfoSingleton._();
    return _instance!;
  }

  PackageInfoSingleton._();

  PackageInfo? _packageInfo;

  /// Initializes the package info by calling PackageInfo.fromPlatform()
  /// This should be called once during app initialization
  Future<void> init() async {
    _packageInfo ??= await PackageInfo.fromPlatform();
  }

  /// Returns the PackageInfo instance
  /// Returns null if init() hasn't been called yet
  PackageInfo? get packageInfo => _packageInfo;

  /// Returns the app name
  /// Returns null if init() hasn't been called yet
  String? get appName => _packageInfo?.appName;

  /// Returns the app version
  /// Returns null if init() hasn't been called yet
  String? get version => _packageInfo?.version;

  /// Returns the build number
  /// Returns null if init() hasn't been called yet
  String? get buildNumber => _packageInfo?.buildNumber;

  /// Returns the package name
  /// Returns null if init() hasn't been called yet
  String? get packageName => _packageInfo?.packageName;
}
