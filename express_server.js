const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

function generateRandomString() {
  let shortURL = '';
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 6; i++) {
    shortURL += chars[Math.floor(Math.random() * chars.length)];
  }
  return shortURL;
};

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
  "userRandomID": {
    id: "userRandomID", 
    email: "user@email.com", 
    password: "first-user"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@email.com", 
    password: "second-user"
  }
};

const newUser = (email, password) => {
  const userStr = generateRandomString();
  users[userStr] = {
    id: userStr,
    email,
    password,
  }
  return userStr;
};

const checkEmail = (email, users) => {
  for (const user in users) {
    for (const prop in users[user]) {
      if (users[user].email === email) {
        return true;
      }
    }
  }
  return false;
};

app.get("/", (req, res) => { // register handler on root path(home page), "/"
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => { // add route/endpoint
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => { // response can contain HTML code, which render in client browser
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  if (!templateVars.user) {
    res.redirect("/login");
  } else {
    res.render("urls_index", templateVars);
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
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars)
});
app.post("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  if (!templateVars.user) {
    res.status(403).send("Error: Action is prohibited");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("users_register", templateVars);
});
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("users_login", templateVars);
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});
app.post("/login", (req, res) => {
  if (!checkEmail(req.body.email, users)) {
    res.status(403).send("Error: User does not exist");
  } else if (checkEmail(req.body.email, users)) {
    for (const user in users) {
      for (const prop in users[user]) {
        if (users[user].email === req.body.email && users[user].password !== req.body.password) {
            res.status(403).send("Error: Invalid password");
        } else {
          const userStr = users[user].id;
          res.cookie("user_id", userStr);
          res.redirect("/urls");
        }
      }
    }
  }
});
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});