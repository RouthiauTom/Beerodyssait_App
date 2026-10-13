#!/bin/sh
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"
if [ -x "$project_dir/.tools/node-v22.23.3-darwin-arm64/bin/node" ]; then
 export PATH="$project_dir/.tools/node-v22.23.3-darwin-arm64/bin:$PATH"
fi
npm run build
exec npm run preview -- "$@"
