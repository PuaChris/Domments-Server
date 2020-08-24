const express = require('express');

const server = express();

// Express' static middle ware to use static files (HTML, CSS and JS) from the directory specified -> In this case, the folder is called "public"
server.use(express.static("public"));

server.get("/", (req, res) => {
  res.send("Hello, World!");
})

server.listen(process.env.PORT || 4000,
  () => console.log("Server is running at http://localhost:4000/")
);

