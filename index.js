require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const bodyParser = require("body-parser");
const { URL } = require("url");

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/hello", (req, res) => {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const original_url = req.body.url;

  let urlObject;
  try {
    urlObject = new URL(original_url);
  } catch {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(urlObject.hostname, async (err) => {
    if (err) return res.json({ error: "invalid url" });

    const count = await Url.countDocuments({});
    const short_url = count + 1;

    const newUrl = new Url({ original_url, short_url });
    await newUrl.save();

    res.json({
      original_url,
      short_url,
    });
  });
});

app.get("/api/shorturl/:short", async (req, res) => {
  const entry = await Url.findOne({ short_url: req.params.short });

  if (!entry) return res.json({ error: "No short URL found" });

  res.redirect(entry.original_url);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
