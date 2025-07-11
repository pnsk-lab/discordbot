#!/usr/bin/env bash

echo "Running build script..."
pwd
ls
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/prisma generate
# ?

echo "Complete!"
