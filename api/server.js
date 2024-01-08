const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const bodyParser = require("body-parser");
const cors = require("cors");

// server.use(bodyParser.json());

// server.use(middlewares);
server.use(cors());

const formatResponse = (imagesData, historyData, page, limit) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedHistory = historyData.slice(startIndex, endIndex);

  return {
    data: {
      images: imagesData || {},
      transactionHistory: paginatedHistory || [],
    },
  };
};

server.get("/historytest/detail/:id", (req, res) => {
  const historyId = req.params.id.toString();

  let resultsImages = router.db.get("data.images").value();
  let transactionHistory = router.db.get("data.transactionHistory").value();

  // Flatten the transactionHistory array
  let results = [];
  transactionHistory.forEach((item) => {
    results = results.concat(item.history);
  });

  // console.log(results, "results");
  // Find the history item by ID
  const selectedHistory = results.find((item) => item.id == historyId);

  if (!selectedHistory) {
    res.status(404).jsonp({ error: "History item not found" });
    return;
  }

  // Prepare the response data for the detail page
  const responseData = {
    data: {
      images: filterImagesByCustodian(resultsImages, selectedHistory.bankCustodian) || {},
      transactionHistoryDetail: {
        date: selectedHistory.date,
        history: [selectedHistory],
      },
    },
  };

  res.jsonp(responseData);
});

function filterImagesByCustodian(images, bankCustodian) {
  const filteredImages = {};
  Object.keys(images).forEach((key) => {
    if (key === bankCustodian) {
      filteredImages[key] = images[key];
    }
  });
  return filteredImages;
}

server.get("/historytest", (req, res) => {
  let resultsImages = router.db.get("data.images").value();
  let transactionHistory = router.db.get("data.transactionHistory").value();

  // Filter by mataUang, jenisTransaksi, and status
  if (req.query.mataUang && req.query.mataUang !== "all") {
    const mataUangValues = Array.isArray(req.query.mataUang) ? req.query.mataUang : [req.query.mataUang];
    transactionHistory = transactionHistory.map((item) => {
      return {
        date: item.date,
        history: item.history.filter((historyItem) => mataUangValues.includes(historyItem.mataUang)),
      };
    });
  }

  if (req.query.jenisTransaksi && req.query.jenisTransaksi !== "all") {
    transactionHistory = transactionHistory.map((item) => {
      return {
        date: item.date,
        history: item.history.filter((historyItem) => historyItem.jenisTransaksi === req.query.jenisTransaksi),
      };
    });
  }

  if (req.query.status && req.query.status !== "all") {
    const statusValues = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
    transactionHistory = transactionHistory.map((item) => {
      return {
        date: item.date,
        history: item.history.filter((historyItem) => statusValues.includes(historyItem.status)),
      };
    });
  }

  // Filter by month
  if (req.query.month) {
    const monthValue = parseInt(req.query.month);
    transactionHistory = transactionHistory.filter((item) => {
      const itemMonth = parseInt(item.date.split("-")[1]);
      return itemMonth === monthValue;
    });
  }

  let results = [];
  transactionHistory.forEach((item) => {
    results = results.concat(item.history);
  });

  results = results.sort((a, b) => new Date(b.tanggalOrder) - new Date(a.tanggalOrder));

  const totalCount = results.length;

  const page = parseInt(req.query._page) || 1;
  const limit = parseInt(req.query._limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedResults = results.slice(startIndex, endIndex);

  const groupedResults = paginatedResults.reduce((acc, item) => {
    const date = item.tanggalOrder.split("/").reverse().join("-");
    if (!acc[date]) {
      acc[date] = { date, history: [] };
    }
    acc[date].history.push(item);
    return acc;
  }, {});

  const formattedResults = Object.values(groupedResults).map((item) => {
    return {
      date: item.date,
      history: item.history,
    };
  });

  const responseData = {
    data: {
      images: resultsImages || {},
      transactionHistory: formattedResults || [],
      totalCount: totalCount,
    },
  };

  setTimeout(() => {
    res.jsonp(responseData);
  }, 5000);
});

server.use("/historytest", router);

server.post("/verify-pin", (req, res) => {
  const { pin } = req.body;
  // console.log(req);

  const correctPIN = "123456";

  if (pin === correctPIN) {
    res.json({ success: true, message: "PIN verified successfully" });
  } else {
    res.status(401).json({ success: false, error: "Incorrect PIN" });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});
