#!/bin/bash
#
# example-citynet-query.sh
#
# Run a semantic query using a question string as input
#
# The result is returned in JSON format
#


LOGIN=""
PASSWORD=""

AUTH_URL="https://api.cloud.nalantis.com/auth/v2/users/login"
API_URL="https://api.cloud.nalantis.com/api"

# Login with credentials and acquire JWT token
JWT=$(curl -i -s --data "login=${LOGIN}" --data "password=${PASSWORD}" "${AUTH_URL}" | grep 'Authorization: Bearer' | sed -e 's/Authorization: Bearer //' | tr -d '\n\r')

# Construct JSON request instance
read -r -d '' REQUEST <<-EOF
{
	"query":"Doet Gent mee aan het project policy Development based on Advanced Geospatial Data Analytics and Visualisation?",
	"targetDocumentType":"citynet",
	"resultDetailLevel": 9,
	"rows": 10
}
EOF

# Send request
curl -s -H "Authorization: Bearer ${JWT}" -H "Content-type: application/json" -H "Accept: application/json" --data "$REQUEST" "${API_URL}/v2/documents/query/semantic/generic"

echo ""
