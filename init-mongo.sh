#!/bin/bash
mongod --replSet rs0 --bind_ip_all &

# Wait for MongoDB to start
sleep 10

# Initialize the replica set
mongosh <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" }
  ]
})
EOF

# Wait to ensure the replica set initiation completes
sleep 5

# Keep the script running to avoid container exit
tail -f /dev/null
