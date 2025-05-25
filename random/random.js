//import axios from 'axios';
const axios = require('axios'); // legacy way

// Make a request for a user with a given ID
//axios.get('https://www.random.org/integers/?num=16&min=-65535&max=65536&col=2&base=10&format=plain&rnd=new')
axios.get('https://www.random.org/sequences/?min=1&max=10000&col=2&format=plain&rnd=new')
  .then(function (response) {
    // handle success
    //console.log(response);
    console.log(response.data);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
