#!/bin/bash
# scripts/prune-images.sh
# Usage: ./scripts/prune-images.sh <IMAGE_NAME> <KEEP_COUNT>

IMAGE_NAME=$1
KEEP_COUNT=$2

if [ -z "$IMAGE_NAME" ] || [ -z "$KEEP_COUNT" ]; then
    echo "Usage: $0 <IMAGE_NAME> <KEEP_COUNT>"
    exit 1
fi

echo "Pruning images for $IMAGE_NAME, keeping latest $KEEP_COUNT..."

# Get all digests for the image, sorted by time (newest last)
# We filter for images that HAVE a version/digest
DIGESTS=$(gcloud artifacts docker images list "$IMAGE_NAME" --sort-by="~CREATE_TIME" --format="value(DIGEST)")

COUNT=$(echo "$DIGESTS" | wc -l)

if [ "$COUNT" -le "$KEEP_COUNT" ]; then
    echo "Only $COUNT images found. No pruning needed."
    exit 0
fi

TO_DELETE_COUNT=$((COUNT - KEEP_COUNT))
TO_DELETE=$(echo "$DIGESTS" | head -n "$TO_DELETE_COUNT")

echo "Deleting $TO_DELETE_COUNT old images..."

for DIGEST in $TO_DELETE; do
    echo "Deleting $IMAGE_NAME@$DIGEST"
    gcloud artifacts docker images delete "$IMAGE_NAME@$DIGEST" --quiet --delete-tags
done

echo "Cleanup complete."
