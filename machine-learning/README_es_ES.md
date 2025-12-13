# Immich Machine Learning

- Clasificación de imágenes
- Incorporación de CLIP
- Reconocimiento facial

# Configuración

Este proyecto utiliza [Poetry](https://python-poetry.org/docs/#installation), así que asegúrate de instalarlo primero.
Ejecutar `poetry install --no-root --with dev` instalará todo lo necesario en un entorno virtual aislado.

Para agregar o eliminar dependencias, puedes utilizar los comandos `poetry add $PACKAGE_NAME` y `poetry remove $PACKAGE_NAME`, respectivamente.
Asegúrate de hacer commit de los archivos `poetry.lock` y `pyproject.toml` para reflejar cualquier cambio en las dependencias.

# Pruebas de carga

Para medir la velocidad y latencia de inferencia, puedes utilizar [Locust](https://locust.io/) con el archivo `locustfile.py` proporcionado.
Locust funciona haciendo consultas a los puntos finales del modelo y agregando estadísticas, lo que significa que la aplicación debe estar desplegada.
Puedes ejecutar `load_test.sh` para implementar automáticamente la aplicación localmente e iniciar Locust, ajustando opcionalmente sus variables de entorno según sea necesario.

Alternativamente, para pruebas más personalizadas, también puedes ejecutar `locust` directamente: consulta la [documentación](https://docs.locust.io/en/stable/index.html). Ten en cuenta que, en la jerga de Locust, la concurrencia se mide en `usuarios`, y cada usuario ejecuta una tarea a la vez. Para lograr una concurrencia específica por punto final, multiplica ese número por la cantidad de puntos finales que se desean consultar. Por ejemplo, si hay 3 puntos finales y deseas que cada uno de ellos reciba 8 solicitudes al mismo tiempo, debes configurar el número de usuarios en 24.
