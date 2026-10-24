import 'package:integration_test/integration_test.dart';

import '../test/presentation/widgets/locked_album_photos_test.dart' as photos;

// Dedicated synthetic widget entry point: no account, real server or photographs.
// Run only on the checkout-owned emulator, never an attached personal device.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  photos.main();
}
