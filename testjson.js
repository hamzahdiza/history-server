const fs = require("fs");

fs.readFile("data.json", "utf8", (err, data) => {
  if (err) {
    console.log(`Error reading file from disk: ${err}`);
  } else {
    // parse JSON string to JSON object
    const jsonData = JSON.parse(data);

    // print all data
    console.log(jsonData);
  }
});
