# Immich Mobile Application - Flutter

The Immich mobile app is a Flutter-based solution leveraging the Isar Database for local storage and Riverpod for state management. This structure optimizes functionality and maintainability, allowing for efficient development and robust performance.

## Setup

1. Setup Flutter toolchain using FVM.
2. Run `flutter pub get` to install the dependencies.
3. Run `make translation` to generate the translation file.
4. Run `fvm flutter run` to start the app.

## Translation

To add a new translation text, enter the key-value pair in the `i18n/en.json` in the root of the immich project. Then, from the `mobile/` directory, run

```bash
make translation
```

## Isar models

Isar generates serialization code for the entities in `lib/entities`. 
If you change the properties of an entitiy class, run `dart run build_runner build` to re-generate these classes.

## Immich-Flutter Directory Structure

Below are the directories inside the `lib` directory:

- `constants`: Store essential constants utilized across the application, like colors and locale.

- 'domain': This directory contains the domain layer of Immich. The domain layer is responsible for the business logic of the app.

- 'entities': Data structures, similar to `models`. Unlike models, entities are stored in the on-device database.

- `extensions`: Extensions enhancing various existing functionalities within the app, such as asset_extensions.dart, string_extensions.dart, and more.

- 'infrastructure': The infrastructure layer is responsible for the implementation details of the app. It includes data sources, APIs, and other external dependencies.

- 'interfaces': Consists of Dart interface files defining APIs and contracts.

- 'mixins': .

- `models`: Data structures, similar to `entities`. Unlike entities, models are ephemeral and only kept in memory.

- 'pages': .
 
- `providers`: Section to define module-specific Riverpod providers.

- 'repositories': .

- `routing`: Includes guards like auth_guard.dart, backup_permission_guard.dart, and routers like router.dart and router.gr.dart for streamlined navigation and permission management.

- `services`: Houses services tailored to the module's functionality.

- `theme`: .

- `utils`: A collection of utility classes and functions catering to different app functionalities, including async_mutex.dart, bytes_units.dart, debounce.dart, migration.dart, and more.

- 'widgets': .

## Immich Architectural Pattern

The Immich Flutter app embraces a well-defined architectural pattern inspired by the Model-View-ViewModel (MVVM) approach. This layout organizes modules for models, providers, services, UI, and views, creating a modular development approach that strongly emphasizes a clean separation of concerns.

Please use the `module_template` provided to create a new module.

### Architecture Breakdown

Below is how your code needs to be structured:

- Models: In Immich, Models are like the app's blueprint—they're essential for organizing and using information. Imagine them as containers that hold data the app needs to function. They also handle basic rules and logic for managing and interacting with this data across the app.

- Providers (Riverpod): Providers in Immich are a bit like traffic managers. They help different parts of the app communicate and share information effectively. They ensure that the right data gets to the right places at the right time. These providers use Riverpod, a tool that helps with managing and organizing how the app's information flows. Everything related to the state goes here.

- Services: Services are the helpful behind-the-scenes workers in Immich. They handle important tasks like handling network requests or managing other essential functions. These services work independently and focus on supporting the app's main functionalities.

- UI: In Immich, the UI focuses solely on how things appear and feel without worrying about the app's complex inner workings. You can slot in your reusable widget here.

- Views: Views use Providers to get the needed information and handle actions without dealing with the technical complexities behind the scenes. Normally Flutter's screen & pages goes here.

## Contributing

Please refer to the [architecture](https://immich.app/docs/developer/architecture/) for contributing to the mobile app!
