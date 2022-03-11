#! /bin/bash

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $ROOT_DIR

set -e

PROJECT_ID=digital-ucdavis-edu
GCR_PROJECT_ID=ucdlib-pubreg
CONTAINER_NAME=website-migration-status
IMAGE=gcr.io/$GCR_PROJECT_ID/$CONTAINER_NAME
DEPLOYMENT_NAME=$CONTAINER_NAME

gcloud config set project $PROJECT_ID
gcloud builds submit --tag $IMAGE

gcloud beta run deploy $DEPLOYMENT_NAME \
  --image $IMAGE \
  --platform managed \
  --memory=1Gi \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=1 \
  --execution-environment=gen2 \
  --no-cpu-throttling \
  --set-env-vars=SOURCE_HOST="https://library.ucdavis.edu",SINK_HOST="https://sandbox.library.ucdavis.edu"