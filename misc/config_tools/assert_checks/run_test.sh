#!/bin/bash

VALIDATOR=../scenario_config/validator.py

for i in *.xml; do
    if [ ${i} = "board.xml" ]; then
        continue
    fi

    echo "Checking ${i}"
    ${VALIDATOR} board.xml ${i} --loglevel debug 2>log

    if [ -f ${i%.xml}.expect ]; then
        cat ${i%.xml}.expect | while read msg; do
            if ! grep -F -q "${msg}" log; then
                echo -e "\tMessage not found: ${msg}"
            fi
        done
    fi

    rm -f log
done
