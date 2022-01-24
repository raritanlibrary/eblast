#!/bin/bash

month=0
if [[ $1 != "reset" ]]; then
    month=$(date --date="$(date) + 14 day" +%-m)
    ((month--))
fi

sed -i "s/\(month = \)[0-9]*/\1$month/" src/main.styl