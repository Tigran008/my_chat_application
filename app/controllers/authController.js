const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { hashPass, comparePass } = require("../utils/bcrypt");
require("dotenv").config();

const usersFilePath = path.join(__dirname, "../../public/users.json");
const JWT_SECRET_KEY = process.env.MY_CUSTOM_SECRET_KEY;

const signUp = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Username and password validations
  if (!username || !password) {
    const errorMessage = "Username and password are required.";
    const status = "fail";
    return res
      .status(400)
      .redirect(`signup.html?message=${errorMessage}&status=${status}`);
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{3,15}$/;
  if (!usernameRegex.test(username)) {
    const errorMessage = "Invalid username format. The username must contain letters, numbers, or hyphens and underscores, and be between 3 to 15 characters long.";
    const status = "fail";
    return res
      .status(400)
      .redirect(`signup.html?message=${errorMessage}&status=${status}`);
  }

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    const errorMessage = "Invalid password format. The password must contain numbers, Latin letters, and be at least 8 characters long.";
    const status = "fail";
    return res
      .status(400)
      .redirect(`signup.html?message=${errorMessage}&status=${status}`);
  }

  fs.readFile(usersFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading users file:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    let users = [];
    if (data) {
      try {
        users = JSON.parse(data);
      } catch (parseError) {
        console.error("Error parsing users file:", parseError);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
      const failMessage = "Username already exists";
      const status = "fail";
      return res
        .status(400)
        .redirect(`signup.html?message=${failMessage}&status=${status}`);
    }

    hashPass(password).then((bcryptedPassword) => {
      const token = jwt.sign({ username }, JWT_SECRET_KEY);
      const id = uuid.v4();
      const newUser = { id, username, password: bcryptedPassword, token };
      users.push(newUser);

      fs.writeFile(usersFilePath, JSON.stringify(users), "utf8", (writeErr) => {
        if (writeErr) {
          console.error("Error writing users file:", writeErr);
          return res.status(500).json({ message: "Internal server error" });
        }
        const successMessage = "Signup successful. Please login.";
        const status = "success";
        res
          .status(201)
          .redirect(`/?message=${successMessage}&status=${status}`);
      });
    });
  });
};

const login = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const room = req.body.room;

  fs.readFile(usersFilePath, "utf-8", (err, fileData) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    let users = [];
    if (fileData) {
      try {
        users = JSON.parse(fileData);
      } catch (err) {
        return res.status(500).json({ message: "internal server error" });
      }
    }
    const user = users.find((user) => user.username === username);
    if (!user) {
      const message = "Username does not exist!";
      const status = "fail";
      return res.status(404).redirect(`/?message=${message}&status=${status}`);
    }
    comparePass(password, user.password)
      .then((match) => {
        if (match) {
          const token = jwt.sign({ username, room }, JWT_SECRET_KEY);
          res.redirect(`/chat.html?token=${token}`);
        } else {
          const message = "Incorrect username or password.";
          const status = "fail";
          res.redirect(`/?message=${message}&status=${status}`);
        }
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: `Internal server error: ${err}` });
      });
  });
};

module.exports = { signUp, login };
