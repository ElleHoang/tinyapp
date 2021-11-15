const express = require("express");
const { getUserByEmail } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

app.use(cookieSession({
  name: "session",
  keys: ["cookie-session-key-1", "cookie-session-key-2"]
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs"); // tells Express app to use EJS as templating engine

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aj48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  },
  "1U2r3L": {
    longURL: "http://www.dfakeurlh.com",
    userID: "aJ48lW"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@email.com",
    password: bcrypt.hashSync("1", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@email.com",
    password: bcrypt.hashSync("2", 10)
  }
};

const newUser = (email, password) => {
  //console.log(`********* Password: ${password} *********`);
  const hashPassword = bcrypt.hashSync(password, 10);
  const userStr = generateRandomString();
  users[userStr] = {
    id: userStr,
    email,
    password: hashPassword
  };
  //console.log (`******** Hash: ${hashPassword} *********`);
  return userStr;
};

/*** HELPER FUNCTIONS ***/

const generateRandomString = () => {
  let shortURL = '';
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 6; i++) {
    shortURL += chars[Math.floor(Math.random() * chars.length)];
  }
  return shortURL;
};

const urlsForUser = (id) => {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURL;
};

/*** ROOT & TEST ROUTES ***/
app.get("/", (req, res) => { // register handler on root path(home page), "/"
  const templateVars = { user: users[req.session.user_id] };
  res.render("users_login", templateVars);
});

app.get("/urls.json", (req, res) => { // add route/endpoint
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => { // response can contain HTML code, which render in client browser
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

/*** URLs ROUTES ***/

app.get("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    res.status(401).send("Error: Register or Login to view page");
  } else {
    const templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const templateVars = { user: users[req.session.user_id]};
  if (!templateVars.user) {
    res.status(403).send("Error: Action is prohibited");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id]};
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[req.session.user_id] };
  if (templateVars.longURL === Error) {
    res.status(404).send("Error: Url does not exist");
  }
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
  res.status(401).send("Error: Unauthorized action");
  }
  if (!templateVars.user) {
  res.status(401).send("Error: Unauthorized action");
  }
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("Error: Unauthorized action");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(401).send("Error: Unauthorized action");
  }
});


app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id].longURL) {
    res.status(404).send("Error: Url does not exist");
  } else {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

/*** REGISTER ROUTES ***/

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("users_register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Error: Some fields are incomplete");
  }
  if (getUserByEmail(email)) {
    res.status(400).send("Error: Email already exists");
  } else {
    const userStr = newUser(email, password);
    req.session.user_id = userStr;
    res.redirect("/urls");
  }
});

/*** LOGIN ROUTES ***/

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("users_login", templateVars);
});
app.post("/login", (req, res) => {
  let inputEmail = req.body.email;
  let inputPass = req.body.password;
  if (!getUserByEmail(inputEmail, users)) {
    res.status(403).send("Error: User does not exist");
  } else if (getUserByEmail(inputEmail, users)) {
    for (const user in users) {
      if (users[user].email === inputEmail && bcrypt.compareSync(inputPass, users[user].password)) {
        let userStr = users[user].id;
        req.session.user_id = userStr;
        return res.redirect("/urls");
      }
    }
    res.status(403).send("Error: Invalid password");
  }
});

/*** LOGOUT ROUTE ***/

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

/*** SERVER STARTUP ***/

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});