#!/usr/bin/env bash

echo "Running build script..."
pnpm install
pnpm prisma migrate deploy

echo "Complete!"
