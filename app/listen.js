const app = require("./app");

const port = 9090;

app.listen(port, (err) => {
  if (err) {
    console.error(`Error while trying to listen on port ${port}:`, err);
  } else {
    console.log(`Server is running and listening on port ${port}`);
  }
});