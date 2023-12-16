# Immich Mobile Application - Flutter

The Immich mobile app is a Flutter-based solution leveraging Isar Database for local storage and Riverpod for state management. This structure is designed to optimize functionality and maintainability, allowing for efficient development and robust performance.

## Setup

You will need to setup Flutter in your machine before you can perform any of the development.

## Immich-Flutter Directory Structure

Below are the directory inside the `lib` directory:

- `constants`: Store essential constants utilized across the application, like colours and locale.

- `extensions`: Contains extensions enhancing various existing functionalities within the app, such as asset_extensions.dart, string_extensions.dart, and more.

- `module_template`: Provides a template structure for different modules within the app, including subdivisions like models, providers, services, UI, and views.
  - `models`: Placeholder for storing module-specific models.
  - `providers`: Section to define module-specific Riverpod providers.
  - `services`: Houses services specifically tailored for the module's functionality.
  - `ui`: Contains UI components and widgets for the module.
  - `views`: Placeholder for module-specific views.

- `modules`: Organizes different functional modules of the app, each containing subdivisions for models, providers, services, UI, and views. This structure promotes modular development and scalability.

- `routing`: Includes guards like auth_guard.dart, backup_permission_guard.dart, and routers like router.dart and router.gr.dart for streamlined navigation and permission management.

- `shared`: cache, models, providers, services, ui, views: Encapsulates shared functionalities, such as caching mechanisms, common models, providers, services, UI components, and views accessible across the application.

- `utils`: A collection of utility classes and functions catering to different app functionalities, including async_mutex.dart, bytes_units.dart, debounce.dart, migration.dart, and more.

## Immich Architectural Pattern

The Immich Flutter app embraces a well-defined architectural pattern inspired by the Model-View-ViewModel (MVVM) approach. This layout organizes modules for models, providers, services, UI, and views, creating a modular development approach with a strong emphasis on a clean separation of concerns.

Please use the `module_template` provided to create a new module.

### Architecture Breakdown

Below is how you code need to be structured:

- Models: In Immich, Models are like the blueprint of the app—they're essential for how information is organized and used. Imagine them as containers that hold data the app needs to function. They also handle basic rules and logic for how this data should be managed and interacted with across the app.

- Providers (Riverpod): Providers in Immich are a bit like traffic managers. They help different parts of the app communicate and share information effectively. They ensure that the right data gets to the right places at the right time. These providers use Riverpod, a tool that helps with managing and organizing how the app's information flows. Everythings related to State goes here.

- Services: Services are the helpful behind-the-scenes workers in Immich. They take care of important tasks like handling data storage, making sure the app connects to the internet, or managing other essential functions. These services work independently and focus on supporting the app's main functionalities.

- UI: In Immich, the UI focuses solely on how things appear and feel without worrying about the app's complex inner workings. You can slot in your reusable widget here.

- Views: Views use Providers to get the needed information and handle actions without dealing with the technical complexities behind the scenes. Normally Flutter's screen & pages goes here.

## Contributing

Please refer to the [https://immich.app/docs/overview/support-the-project/](https://immich.app/docs/overview/support-the-project/) for contributing to Immich!
