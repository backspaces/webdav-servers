#!/bin/bash

echo "[`date`] Restarting WebDAV server..."

# Kill any old Deno processes
pkill deno

# Clean up old screen sessions
screen -wipe > /dev/null

# Start server in detached screen session
screen -dmS denoserver deno run -A deno-cli-server.js

echo "[`date`] Deno server launched in screen session 'denoserver'"
