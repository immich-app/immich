import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/service_locator.dart';

void main() {
  // Ensure the bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // DI Injection
  ServiceLocator.configureServices();

  runApp(const MainWidget());
}

class MainWidget extends StatelessWidget {
  const MainWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const Text('Flutter Demo Home Page'),
    );
  }
}
