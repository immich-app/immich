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

## Static Analysis

The following checks of static analysis must pass for a contribution to the mobile app to be valid:

```bash
dart format lib
dart analyze
dart run custom_lint
dcm analyze lib
```

[DCM](https://dcm.dev/) is a vendor tool that needs to be downloaded manually to run locally.
Immich was provided an open source license. 
To use it, it is important that you do not have an active free tier license (can be verified with `dcm license`).
If you have write-access to the Immich repository directly, running dcm in your clone should just work.
If you are working on a clone of a fork, you need to connect to the main Immich repository as remote first:

```bash
git remote add immich git@github.com:immich-app/immich.git
```

## Immich-Flutter Directory Structure

Below are the directory inside the `lib` directory:

- `constants`: Store essential constants utilized across the application, like colors and locale.

- `extensions`: Extensions enhancing various existing functionalities within the app, such as asset_extensions.dart, string_extensions.dart, and more.

- `module_template`: Provides a template structure for different modules within the app, including subdivisions like models, providers, services, UI, and views.

  - `models`: Placeholder for storing module-specific models.
  - `providers`: Section to define module-specific Riverpod providers.
  - `services`: Houses services tailored to the module's functionality.
  - `ui`: Contains UI components and widgets for the module.
  - `views`: Placeholder for module-specific views.

- `modules`: Organizes different functional modules of the app, each containing subdivisions for models, providers, services, UI, and views. This structure promotes modular development and scalability.

- `routing`: Includes guards like auth_guard.dart, backup_permission_guard.dart, and routers like router.dart and router.gr.dart for streamlined navigation and permission management.

- `shared`: cache, models, providers, services, ui, views: Encapsulates shared functionalities, such as caching mechanisms, common models, providers, services, UI components, and views accessible across the application.

- `utils`: A collection of utility classes and functions catering to different app functionalities, including async_mutex.dart, bytes_units.dart, debounce.dart, migration.dart, and more.

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
