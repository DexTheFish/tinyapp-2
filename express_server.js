const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const shortURLLength = 6;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
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


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6); // make a random 6-character string
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

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
  res.render("urls_new");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});