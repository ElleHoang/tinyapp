const bcrypt = require("bcryptjs");
const { users } = require("./database");

const getUserByEmail = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return user;
    }
  }
  return undefined;
};

const newUser = (email, password) => {
  const hashPassword = bcrypt.hashSync(password, 10);
  const userStr = generateRandomString();
  users[userStr] = {
    id: userStr,
    email,
    password: hashPassword
  };
  return userStr;
};

const generateRandomString = () => {
  let shortURL = '';
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 6; i++) {
    shortURL += chars[Math.floor(Math.random() * chars.length)];
  }
  return shortURL;
};

const urlsForUser = (id, urlDatabase) => {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURL[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userURL;
};

module.exports = { getUserByEmail, newUser, generateRandomString, urlsForUser };