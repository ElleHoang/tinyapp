const getUserByEmail = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return user;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail };