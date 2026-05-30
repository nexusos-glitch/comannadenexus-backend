#!/usr/bin/env bash
# CommandNexus API Key Generator
# Wrapper script for the VPS / command line usage
set -e

echo ""
echo "============================================="
echo "       CommandNexus API Key Generator        "
echo "============================================="
echo ""

KEY_NAME=$1

if [ -z "$KEY_NAME" ]; then
    read -p "Enter a name/identifier for the new API Key (e.g. CLI_APP_1): " KEY_NAME
fi

if [ -z "$KEY_NAME" ]; then
    echo "Error: Key name cannot be empty."
    exit 1
fi

echo "Generating... please wait."
echo ""

# Fallback to direct script if npm run fails
node scripts/generate-key.cjs "$KEY_NAME"
