const express = require("express");
const app = express();
const mysql = require("mysql2");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mysqlrootpassword",
  database: "user",
});
connection.connect();
app.get("/", (req, res) => {
  res.render("home.ejs");
});
//show all users
app.get("/users", (req, res) => {
  let q1 = `SELECT COUNT(*) FROM userdata`;

  connection.query(q1, (err, result) => {
    if (err) {
      console.error("Errr in Count Query:", err);
      return res.send("Something WRONG in the DB !");
    }
    let count = result[0]["COUNT(*)"];
    let q2 = `SELECT * FROM userdata`;
    let q3 = `SELECT username  FROM userdata ORDER BY username ASC `;
    connection.query(q2, q3, (err, users) => {
      if (err) {
        console.error("Errr in Count Query:", err);
        return res.send("Something WRONG in the DB !");
      }
      connection.query(q3, (err, usernames) => {
        if (err) {
          console.error("Error in usernames query:", err);
          return res.send("Something WRONG in the DB !");
        }
        res.render("showUser.ejs", { users, count });
      });
    });
  });
});
//Add User Route
app.get("/addUser", (req, res) => {
  res.render("addUser.ejs");
});

app.post("/addUser", (req, res) => {
  console.log("REQ.BODY:", req.body);
  let { username, email, password } = req.body;
  let id = uuidv4().slice(0, 5);
  let q = `INSERT INTO userdata (id,username,email,password) VALUES('${id}','${username}','${email}','${password}')`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      console.log("INSERT RESULT:", result);
      res.redirect("/users");
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.send("Something WRONG in the DB !");
  }
});

//Edit Route
app.get("/users/:id/edit", (req, res) => {
  let { id } = req.params;
  let q = `SELECT*FROM userdata WHERE id='${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      res.render("edit.ejs", { user });
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.send("Something WRONG in the DB !");
  }
});

app.patch("/users/:id", (req, res) => {
  let { id } = req.params;
  let { username: newUser, password: formPass } = req.body;
  let q = `SELECT * FROM userdata WHERE id='${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      if (formPass != user.password) {
        res.render("edit.ejs", { user, error: "Wrong password!" });
      } else {
        let q2 = `UPDATE userdata SET username='${newUser}' WHERE id='${id}'`;
        try {
          connection.query(q2, (err, result) => {
            if (err) throw err;
            res.redirect("/users");
          });
        } catch (err) {
          res.send("Something WRONG in the DB !");
        }
      }
    });
  } catch (err) {
    res.send("Something WRONG in the DB !");
  }
});
//Delete Route
app.get("/users/:id/delete", (req, res) => {
  let { id } = req.params;
  let q = `SELECT*FROM userdata WHERE id='${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      res.render("delete.ejs", { user });
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.send("Something WRONG in the DB !");
  }
});
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  const { password: formPass } = req.body;

  const q = `SELECT * FROM userdata WHERE id='${id}'`;
  connection.query(q, (err, result) => {
    if (err) return res.status(500).send("Something wrong with the DB!");

    const user = result[0];
    if (!user) return res.status(404).send("User not found");

    if (formPass != user.password) {
      return res.render("delete.ejs", { user, error: "Wrong password!" });
    }

    const q2 = `DELETE FROM userdata WHERE id='${id}'`;
    connection.query(q2, (err, result) => {
      if (err) return res.status(500).send("Something wrong with the DB!");
      return res.redirect("/users");
    });
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
