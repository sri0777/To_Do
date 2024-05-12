const express = require("express");
const app = express();
const session = require("express-session");
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "abc123",
  })
);
// app.use(express.static('views'));
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
const mongodb = require("mongodb");
let ObjectId = mongodb.ObjectId;
const client = mongodb.MongoClient;
let dbInstance;
client
  .connect(
    "mongodb+srv://sri0777:2211981406@cluster777.abi0vyz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster777"
  )
  .then((database) => {
    dbInstance = database.db("To-Do");
    if (dbInstance) console.log("connected to database");
  });
app.get(["/", "/login"], (req, res) => {
  res.render("login", { mes: "" });
});
app.get("/signup", (req, res) => {
  res.render("signup", { mes: "" });
});
app.get("/tasklist", (req, res) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    dbInstance
      .collection("Tasks")
      .findOne({ username: req.session.user.username })
      .then((obj) => {
        res.render("tasklist", { data: obj.task,username: req.session.user.username,
        });
      });
  }
});
app.post("/addTask", (req, res) => {
  let obj = {
    task: req.body.task,
    id: Date.now(),
    status: 0,
  };
  dbInstance
    .collection("Tasks")
    .updateOne(
      { username: req.session.user.username },
      {
        $push: { task: obj },
      }
    )
    .then((data) => {
      res.redirect("/tasklist");
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/deleteTask/:username/:id", (req, res) => {
  dbInstance
    .collection("Tasks")
    .updateOne(
      { username: req.params.username },
      { $pull: { task: { id: parseInt(req.params.id) } } }
    )
    .then((result) => {
      res.redirect("/tasklist");
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/status/:username/:id", (req, res) => {
  let taskId = parseInt(req.params.id); // Convert the id from string to number
  dbInstance
    .collection("Tasks")
    .findOne({ username: req.params.username })
    .then((user) => {
      let task = user.task.find((task) => task.id === taskId);
      let status = task.status === 0 ? 1 : 0;
      return dbInstance
        .collection("Tasks")
        .updateOne(
          { username: req.params.username, "task.id": taskId },
          { $set: { "task.$.status": status } }
        );
    })
    .then((result) => {
      res.redirect("/tasklist");
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});
app.post("/login", (req, res) => {
  dbInstance
    .collection("Credentials")
    .find(req.body)
    .toArray()
    .then((data) => {
      if (data.length > 0) {
        req.session.user = req.body;
        res.redirect("/tasklist");
      } else {
        res.render("login", { mes: "User Doesn't Exists" });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post("/signup", (req, res) => {
  let obj = {
    task: [],
    username: req.body.username,
  };
  dbInstance
    .collection("Credentials")
    .find(req.body)
    .toArray()
    .then((data) => {
      if (data.length > 0) {
        res.render("signup", { mes: "User Already Exists" });
      } else {
        req.body.role = "user";
        dbInstance
          .collection("Credentials")
          .insertOne(req.body)
          .then((data) => {
            res.redirect("/login");
          })
          .catch((err) => {
            console.log(err);
          });
        dbInstance.collection("Tasks").insertOne(obj);
      }
    });
});
app.listen(3000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("connected to Server at 3000 port");
  }
});
