const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs'); // tells Express app to use EJS as templating engine

const urlDatabase = {
  "b2xVn2": 'http://www.lighthouselabs.ca',
  "9sm5xK": 'http://www.google.com'
};

app.get('/', (req, res) => { // register handler on root path(home page), '/'
  res.send('Hello!');
});
app.get('/urls.json', (req, res) => { // add route/endpoint
  res.json(urlDatabase);
})
app.get('/hello', (req, res) => { // response can contain HTML code, which render in client browser
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});