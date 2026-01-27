export default async function handler(req, res) {
  const { playlist_id, offset = 0 } = req.query;

  if (!playlist_id) {
    return res.status(400).json({ error: "Missing playlist_id" });
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return res
      .status(tokenRes.status)
      .json({ error: "Failed to get token", details: errText });
  }

  const { access_token } = await tokenRes.json();

  const tracksRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=50&offset=${offset}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const data = await tracksRes.json();
  res.status(tracksRes.status).json(data);
}
