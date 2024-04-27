import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/service_locator.dart';
import 'package:immich_mobile/presentation/home_page/cubit/home_cubit.dart';

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
      home: MultiBlocProvider(
        providers: [BlocProvider(create: (context) => HomeCubit())],
        child: Scaffold(
          appBar: AppBar(
            title: const Text("Immich v2"),
          ),
          body: BlocConsumer<HomeCubit, HomeState>(
            listener: (context, state) {
              print(state);
            },
            builder: (context, state) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Album count: ${state.albumCount}"),
                    ElevatedButton(
                      onPressed: () {
                        context.read<HomeCubit>().increaseAlbumCount();
                      },
                      child: const Text("Increase"),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        context.read<HomeCubit>().decreaseAlbumCount();
                      },
                      child: const Text("Decrease"),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
