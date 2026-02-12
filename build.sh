#!/usr/bin/env bash

echo "Running build script..."
bun install
bun prisma migrate deploy

echo "Complete!"
