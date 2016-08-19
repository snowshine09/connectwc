##Installation
env:
nodejs, npm

npm install express --save or -g
npm install -g nodemon

to run the app:
npm install
node ./bin/www or npm start

when importing the db, use
mongoimport --db weare --collection user --drop --jsonArray --file ~/Workspace/processcsv/students_processed.json