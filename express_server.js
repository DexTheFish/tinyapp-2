const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const shortURLLength = 6;
const userIDLength = 8;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// what happens if you try to register without an email or a password?
// what happens if you try to register a user with an email that already exists?


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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(shortURLLength);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (user && user.email.toUpperCase() === email.toUpperCase() && user.password === password) {
    res.cookie("user_id", user.id);
    return res.redirect("/urls");
  }
  res.status(400).send("Invalid login credentials");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("user_login", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString(userIDLength);
  const email = req.body.email;
  const password = req.body.password;
  if (!email.includes('@') || password === '') {
    return res.status(400).send('Email and password must have a valid format!');
  }
  if (!isNewEmail(email, users)) {
    return res.status(400).send('That email has already been registered!');
  }
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
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(res.statusCode);
  res.redirect(longURL);

  // What would happen if a client requests a non-existent shortURL?
  //  -> then longURL is undefined, so we redirect to /u/undefined, which redirects to /u/undefined...
  // What happens to the urlDatabase when the server is restarted?
  //  -> it gets wiped to the default.
  // What type of status code do our redirects have? What does this status code mean?
  // look up the MDN documentation for 300 status codes.
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});



app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
