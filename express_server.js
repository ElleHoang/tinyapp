const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, newUser, generateRandomString, urlsForUser } = require("./helpers");
const { urlDatabase, users } = require("./database");
const app = express();
const PORT = 8080;

app.use(cookieSession({
  name: "session",
  keys: ["cookie-session-key-1", "cookie-session-key-2"]
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

/*** ROOT & TEST ROUTES ***/

app.get("/", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (!templateVars.user) {
    res.redirect("/login");
  } else {
  res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

/*** URLs ROUTES ***/

app.get("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    res.status(401).send("Error: Register or Login to view page");
  } else {
    const templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id] };
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
  //if (req.body.email === "" || req.body.password === "") {
  if (!email || !password) {  
    res.status(400).send("Error: Some fields are incomplete");
  }
  if (getUserByEmail(email, users)) {
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
  if (!templateVars.user) {
    res.render("users_login", templateVars);
  } else {
    res.redirect("/urls");
  }
  
});
app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPass = req.body.password;
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