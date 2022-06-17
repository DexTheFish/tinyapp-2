const generateRandomString = function(length) {
  const lowerAlphabet = 'abcdefghijklmnopqrstuvwxyz';
  const upperAlphabet = lowerAlphabet.toUpperCase();
  const alphaNumericChars = lowerAlphabet + upperAlphabet + '0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * 62);
    randomString += alphaNumericChars[randomIndex];
  }
  return randomString;
};

const getUserByEmail = function(email, userDatabase) {
  for (const userID in userDatabase) {
    if (userDatabase[userID].email.toUpperCase() === email.toUpperCase()) {
      return userDatabase[userID];
    }
  }
};

const isNewEmail = function(email, userDatabase) {
  return !Boolean(getUserByEmail(email, userDatabase));
};

const urlsForUser = function(userID, urlDatabase) {
  const userURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

module.exports = { generateRandomString, getUserByEmail, isNewEmail, urlsForUser };