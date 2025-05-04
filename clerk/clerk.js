import pkg from '@clerk/clerk-js';
const { Clerk } = pkg;

//console.log(process.env.CLERK_SECRET_KEY);
//const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY
//const publishableKey = "pk_test_c3VubnktbWFzdG9kb24tOTQuY2xlcmsuYWNjb3VudHMuZGV2JA";
console.log(publishableKey);

const clerk = new Clerk(publishableKey);
/* await clerk.load();

if (clerk.user) {
  document.getElementById('app').innerHTML = `
    <div id="user-button"></div>
  `

  const userButtonDiv = document.getElementById('user-button')

  clerk.mountUserButton(userButtonDiv)
} else {
  document.getElementById('app').innerHTML = `
    <div id="sign-in"></div>
  `

  const signInDiv = document.getElementById('sign-in')

  clerk.mountSignIn(signInDiv)
} */