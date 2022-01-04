#!/bin/bash

# Creamos el acceso para que el servidor Apache sirva las páginas
ln -s docs public

# Ignoramos la modificación del archivo de configuración
git update-index --assume-unchanged docs/config.js

# Generamos el archivo de configuración para gitpod
sed -i '/^const redirect/d' public/config.js
cat <<EOF >> public/config.js
const redirect = "${GITPOD_WORKSPACE_URL/:\/\//:\/\/8001-}/";
EOF
