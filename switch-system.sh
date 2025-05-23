#!/bin/bash
# Convenience wrapper for the switch-system.sh tool

# Execute the script in the tools directory
"$(dirname "$0")/src/tools/switch-system.sh" "$@"
