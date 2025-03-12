const axios = require('axios');

// Make a request for a user with a given ID
axios.get('http://hyg.github.io/blog/release/time/d.20241230.md')
  .then(function (response) {
    // handle success
    console.log(response);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });