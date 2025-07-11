#!/usr/bin/env bash

echo "Running build script..."

pnpm exec prisma migrate deploy
# pnpm exec prisma generate
# ?

echo "Complete!"
