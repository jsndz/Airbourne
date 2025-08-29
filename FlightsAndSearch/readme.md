#welcome to Flights and service
To use code
clone the repository 
npm install on terminal
in src/config create config.json with
'''

  "development": {
    "username": "root",
    "password": "<password>",
    "database": "<name of DB>",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }



'''
use '`npx sequalize db:create`

#db design
- airpalne table
-flight 
-airport
-city


## tables
1. city
-cityname
-id
-created_at
-updated_at
1:N
2.Airport
-name
-cityId
-address
-id
-created_at
-updated_at