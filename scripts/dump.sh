#!/bin/bash

# money-bot-test
# money-bot-prod

if [ -z "$1" ]; then
    echo "Usage: $0 <database-name | url>"
    exit 1
fi

DB_NAME=$1

# use localhost if starts with http
if [[ $1 == http* ]]; then
    DB_NAME="local"
fi

# create data/dumps/DB_NAME folder if not exists
mkdir -p data/dumps/$DB_NAME

DATE=$(date +"%Y-%m-%d")

turso db shell $1 .dump > "data/dumps/$DB_NAME/$DATE.sql"
