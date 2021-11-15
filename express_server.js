const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

app.use(cookieParser());
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
  }
  //console.log (`******** Hash: ${hashPassword} *********`);
  return userStr;
};

/*** HELPER FUNCTIONS ***/

function generateRandomString() {
  let shortURL = '';
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 6; i++) {
    shortURL += chars[Math.floor(Math.random() * chars.length)];
  }
  return shortURL;
};

const checkEmail = (email, users) => {
  for (const user in users) {
    //for (const prop in users[user]) {
      if (users[user].email === email) {
        return true;
      }
    //}
  }
  return false;
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
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => { // add route/endpoint
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => { // response can contain HTML code, which render in client browser
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

/*** URLs ROUTES ***/

app.get("/urls", (req, res) => {
  if (!users[req.cookies["user_id"]]) {
    res.status(401).send("Error: Register or Login to view page");
  } else {
    const templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: users[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  if (!templateVars.user) {
    res.status(403).send("Error: Action is prohibited");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  if (!templateVars.user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars)
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls")
  } else {
    res.status(401).send("Error: Unauthorized action");
  }
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (req.cookies["user_id"] === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("Error: Unauthorized action");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send("Error: shortURL not found")
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL.longURL);
  }
});

/*** REGISTER ROUTES ***/

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("users_register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Error: Some fields are incomplete");
  }
  if (checkEmail(email)) {
    res.status(400).send ("Error: Email already exists");
  } else {
    const userStr = newUser(email, password);
    res.cookie("user_id", userStr);
    res.redirect("/urls");
  }
});

/*** LOGIN ROUTES ***/

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("users_login", templateVars);
});
app.post("/login", (req, res) => {
  let inputEmail = req.body.email;
  let inputPass = req.body.password;
  if (!checkEmail(inputEmail, users)) {
    res.status(403).send("Error: User does not exist");
  } else if (checkEmail(inputEmail, users)) {
    for (const user in users) {
      if (users[user].email === inputEmail && bcrypt.compareSync(inputPass, users[user].password)) {
        let userStr = users[user].id;
        res.cookie("user_id", userStr);
        return res.redirect("/urls");  
      }
    }
    res.status(403).send("Error: Invalid password");
  }
});

/*** LOGOUT ROUTE ***/

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

/*** SERVER STARTUP ***/

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});