var mysql      = require('mysql');
require('dotenv').config()

var connectionSchool = mysql.createConnection({
  host     : process.env.DB_SCHOOLS_HOST,
  user     : process.env.DB_SCHOOLS_USER,
  password : process.env.DB_SCHOOLS_PASSWORD,
  database : process.env.DB_SCHOOLS_NAME
});

var connectionDefault = mysql.createConnection({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME
});

var connection = mysql.createConnection({
  host     : process.env.DB_DEMO_HOST,
  port     : process.env.DB_DEMO_PORT,
  user     : process.env.DB_DEMO_USER,
  password : process.env.DB_DEMO_PASSWORD,
  database : process.env.DB_DEMO_NAME
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  } 
  console.log('connected as id ' + connection.threadId);
});

connection.query('SELECT table_name FROM information_schema.TABLES ', function (error, results, fields) {
  if (error) throw error;
  console.log('tables: ', results);
});
connection.end();