const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const shortURLLength = 6;
const userIDLength = 8;
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set("view engine", "ejs");
require('dotenv').config();
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_KEY_1, process.env.SESSION_KEY_2],
  // keys should be defined in .env, but for testing purposes the following can be uncommented:
  //keys: ["do not store keys as plaintext", "or you are asking for trouble"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const { generateRandomString, getUserByEmail, isNewEmail, urlsForUser } = require("./helpers");

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
    password: process.env.PASSWORD_1
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: process.env.PASSWORD_2
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
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
  const userID = req.session.user_id;
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
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }
  res.status(403).send("Invalid login credentials");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    return res.redirect("/urls");
  }
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
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
  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const shortURL = req.params.shortURL;
  if (!user || !urlDatabase[shortURL] || userID !== urlDatabase[shortURL].userID) {
    return res.status(403).send("That URL is not yours to delete!\n");
  }
  delete urlDatabase[shortURL];
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
  const templateVars = { user: users[req.session.user_id] };
  if (!templateVars.user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = users[req.session.user_id];
  if (!user || !urlDatabase[shortURL] || user.id !== urlDatabase[shortURL].userID) {
    return res.status(403).send("That URL is not yours to change!\n");
  }
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = { shortURL, longURL, user };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  // update a url
  const userID = req.session.user_id;
  const user = users[userID];
  const shortURL = req.params.id;
  // display a message if the user is not logged in, or if the URL does not belong to them
  if (!user || !urlDatabase[shortURL] || userID !== urlDatabase[shortURL].userID) {
    return res.status(403).send("That URL is not yours to change!\n");
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
