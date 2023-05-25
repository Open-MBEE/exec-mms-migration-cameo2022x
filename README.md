# mms-migration-cameo2022x
Script to help with mms data migration for cameo 19 to 2022x projects, see [this wiki page](https://openmbee.atlassian.net/l/cp/Ag00nvsb) for entire migration process.

# How to use

Install [node.js](https://nodejs.org/en)

For each project/branch to be migrated:

1. get cameo 19x json from branch:

    `curl -X GET -u mms4user {http://mms4domain.com}/projects/{projectId}/refs/{master}/elements > input.json`

2. run process script to get cameo 2022x json as output.json

    `node process.js`

3. post output back to mms with overwrite flag

    `curl -X POST -u mms4user -H 'Content-Type: application/json' -d@output.json {http://mms4domain.com}/projects/{projectId}/refs/{master}/elements?overwrite=true`
