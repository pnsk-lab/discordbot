#!/usr/bin/env bash

echo "Running build script..."
pnpm install
pnpm migrate deploy

echo "Complete!"
