#!/usr/bin/env bash

echo "Running build script..."

pnpm prisma migrate deploy

echo "Complete!"
