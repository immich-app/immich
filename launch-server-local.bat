@echo off
setlocal EnableExtensions

set "REPO=D:\_DESARROLLO\REPOSITORIOS\immich"
set "DOCKER_DIR=D:\_DESARROLLO\PROJECTS\JB_FOTOS\docker"

cd /d "%REPO%"

echo [1/3] Compilando server...
call mise //server:build
if errorlevel 1 goto :error

echo [1/3] Compilando web...
call mise //web:build
if errorlevel 1 goto :error

echo [2/3] Parando jbfotos-immich_server...
docker stop jbfotos-immich_server

echo [3/3] Lanzando server local en http://localhost:2255 ...
cd /d "%DOCKER_DIR%"
docker run --rm -it --name jbfotos-immich_server_dev ^
  --network jbfotos-immich_default ^
  --env-file .env ^
  -p 2255:2283 ^
  -v "D:/_DESARROLLO/PROJECTS/JB_FOTOS/DATA/FOTOS:/data" ^
  -v "D:/FOTOS:/mnt/external/archivo" ^
  -v "D:/_DESARROLLO/REPOSITORIOS/immich/server/dist:/usr/src/app/server/dist:ro" ^
  -v "D:/_DESARROLLO/REPOSITORIOS/immich/web/build:/build/www:ro" ^
  jbfotos-immich-server:local

goto :eof

:error
echo.
echo Error en la compilacion. No se ha parado ni lanzado ningun contenedor.
exit /b 1
