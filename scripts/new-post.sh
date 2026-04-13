#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: npm run new-post \"my-post-title\""
  exit 1
fi

SLUG=$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
DATE=$(date +%Y-%m-%d)
FILE="src/content/writings/${SLUG}.md"

if [ -f "$FILE" ]; then
  echo "Post already exists: $FILE"
  exit 1
fi

cat > "$FILE" << EOF
---
title: "$1"
date: $DATE
description: ""
draft: true
---

EOF

echo "Created $FILE"
echo "Edit the file, then set draft: false when ready to publish."
