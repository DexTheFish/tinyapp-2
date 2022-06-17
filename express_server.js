const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const shortURLLength = 6;
const userIDLength = 8;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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
  return null;
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

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect("/login");
  }
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // add a url
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.status(403).send("You must be logged in to add a URL.\n");
  }
  const shortURL = generateRandomString(shortURLLength);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const user = getUserByEmail(email, users);
  if (user && user.email.toUpperCase() === email.toUpperCase() && bcrypt.compareSync(req.body.password, user.password)) {
    res.cookie("user_id", user.id);
    return res.redirect("/urls");
  }
  res.status(403).send("Invalid login credentials");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  if (templateVars.user) {
    return res.redirect("/urls")
  }
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  if (templateVars.user) {
    return res.redirect("/urls");
  }
  res.render("user_login", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString(userIDLength);
  const email = req.body.email;
  let password = req.body.password;
  if (!email.includes('@') || password === '') {
    return res.status(400).send('Email and password must have a valid format!');
  }
  if (!isNewEmail(email, users)) {
    return res.status(400).send('That email has already been registered!');
  }
  password = bcrypt.hashSync(password, 10);
  const newUser = {
    id,
    email,
    password
  };
  users[id] = newUser;
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  const shortURL = req.params.shortURL;
  if (!user || !urlDatabase[shortURL] || userID !== urlDatabase[shortURL].userID) {
    return res.status(403).send("That URL is not yours to delete!\n");
  }
  delete urlDatabase[shortURL]
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  // redirect to longURL. Does not require permission or login.
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("Page not found");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  if (!templateVars.user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  // update a url
  const userID = req.cookies.user_id;
  const user = users[userID];
  const shortURL = req.params.id;
  // display a message if the user is not logged in, or if the URL does not belong to them
  if (!user || !urlDatabase[shortURL] || userID !== urlDatabase[shortURL].userID) {
    return res.status(403).send("That URL is not yours to change!\n");
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
