require("dotenv").config();
const express = require("express");
const request = require("request");
const querystring = require("querystring");
const scrape = require("./scrape");
const app = express();
const redirect_uri =
  process.env.REDIRECT_URI || "http://localhost:3001/callback";
const cors = require("cors");

//middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/login", function (req, res) {
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope:
          "user-read-private user-read-email playlist-modify-public playlist-modify-private",
        redirect_uri,
      })
  );
});

app.get("/callback", function (req, res) {
  let code = req.query.code || null;
  let authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };
  request.post(authOptions, function (error, response, body) {
    var access_token = body.access_token;
    let uri = process.env.FRONTEND_URI || "http://localhost:3000";
    res.redirect(uri + "?access_token=" + access_token);
  });
});

app.post("/songs", async (req, res) => {
  const link = req.body.youtube_playlist_link;
  const playlist = await scrape.scrape(link);
  res.json(playlist);
});

let port = process.env.PORT || 3001;
console.log(
  `Listening on port ${port}. Go /login to initiate authentication flow.`
);
app.listen(port);
