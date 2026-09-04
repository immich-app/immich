import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:hooks/hooks.dart';
import 'package:native_toolchain_rust/native_toolchain_rust.dart';

const _crate = '../crates/immich_core_ffi';

// Cargo's dep-info only lists source files, so these have to rerun the hook too.
const _manifests = [
  '../Cargo.toml',
  '../Cargo.lock',
  '../crates/immich_core/Cargo.toml',
  '$_crate/Cargo.toml',
  '$_crate/rust-toolchain.toml',
];

void main(List<String> args) async {
  await build(args, (input, output) async {
    if (!input.config.buildCodeAssets) return;
    final code = input.config.code;
    output.dependencies.addAll(_manifests.map(input.packageRoot.resolve));
    final target = _crossTarget(code);
    if (target != null) {
      await _rustup(['target', 'add', '--toolchain', await _channel(input), target]);
    }
    await RustBuilder(
      assetName: 'src/bindings.g.dart',
      cratePath: _crate,
      extraCargoEnvironmentVariables: {if (code.targetOS == OS.android) 'RUSTFLAGS': _androidRustFlags(code)},
    ).run(input: input, output: output);
  });
}

// mise sets RUSTUP_TOOLCHAIN, which makes rustup ignore rust-toolchain.toml and never install
// its targets, so add the one this build needs.
String? _crossTarget(CodeConfig code) => switch ((code.targetOS, code.targetArchitecture)) {
  (OS.android, Architecture.arm) => 'armv7-linux-androideabi',
  (OS.android, Architecture.arm64) => 'aarch64-linux-android',
  (OS.android, Architecture.x64) => 'x86_64-linux-android',
  (OS.iOS, Architecture.arm64) when code.iOS.targetSdk == IOSSdk.iPhoneSimulator => 'aarch64-apple-ios-sim',
  (OS.iOS, Architecture.arm64) => 'aarch64-apple-ios',
  (OS.iOS, Architecture.x64) => 'x86_64-apple-ios',
  _ => null,
};

Future<String> _channel(BuildInput input) async {
  final toml = await File.fromUri(input.packageRoot.resolve('$_crate/rust-toolchain.toml')).readAsString();
  final match = RegExp(r'^channel = "([^"]+)"', multiLine: true).firstMatch(toml);
  if (match == null) throw StateError('channel missing in rust-toolchain.toml');
  return match.group(1)!;
}

Future<void> _rustup(List<String> args) async {
  final home = Platform.environment[Platform.isWindows ? 'USERPROFILE' : 'HOME'];
  ProcessResult result;
  try {
    result = await Process.run('rustup', args);
  } on ProcessException {
    if (home == null) rethrow;
    result = await Process.run('$home/.cargo/bin/rustup', args);
  }
  if (result.exitCode != 0) {
    throw ProcessException('rustup', args, '${result.stderr}', result.exitCode);
  }
}

// 16 KB pages, and link against minSdk instead of the API 35 that native_toolchain_rust picks.
String _androidRustFlags(CodeConfig code) {
  final triple = switch (code.targetArchitecture) {
    Architecture.arm => 'armv7a-linux-androideabi',
    Architecture.arm64 => 'aarch64-linux-android',
    Architecture.x64 => 'x86_64-linux-android',
    _ => throw UnsupportedError('Unsupported Android architecture: ${code.targetArchitecture}'),
  };
  return '-C link-arg=-Wl,-z,max-page-size=16384 -C link-arg=--target=$triple${code.android.targetNdkApi}';
}
