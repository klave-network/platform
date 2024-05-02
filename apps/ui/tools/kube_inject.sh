#!/bin/sh
sed -i "s~__KLAVE_API__~${KLAVE_API_URL}~g" ui/index.html
sed -i "s~__KLAVE_AUTH__~${KLAVE_AUTH_URL}~g" ui/index.html
sed -i "s~__SECRETARIUM_ID__~${SECRETARIUM_ID_URL}~g" ui/index.html
npx -y serve ui