const loadingSection = document.getElementById("loading-section");
const resultsSection = document.getElementById("results-section");

const HARDCODED_PLAYLIST_ID = "56afGpmssmu4sR9Pz92jfE";

async function init() {
  startAnalysis();
}

init();

async function startAnalysis() {
  loadingSection.classList.remove("hidden");
  document.getElementById("loading-text").innerText = "Fetching tracks...";

  try {
    await analyzePlaylist(HARDCODED_PLAYLIST_ID);
    loadingSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
  } catch (e) {
    console.error(e);
    alert("Error: " + e.message);
    loadingSection.classList.add("hidden");
  }
}

async function analyzePlaylist(playlistId) {
  let items = [];
  let offset = 0;
  let total = null;

  while (total === null || items.length < total) {
    const response = await fetch(
      `/api/playlist?playlist_id=${playlistId}&offset=${offset}`
    );

    if (!response.ok) {
      const text = await response.text();
      let msg = response.statusText;
      try {
        const err = JSON.parse(text);
        msg = err.error?.message || err.error || msg;
      } catch (e) {}
      throw new Error(msg);
    }

    const data = await response.json();
    items = items.concat(data.items);

    // First request sets the total
    if (total === null) {
      total = data.total;
    }

    document.getElementById(
      "loading-text"
    ).innerText = `Fetching tracks... (${items.length}/${total})`;

    if (!data.next) {
      break;
    }

    // Increment offset for next page
    offset += data.items.length;
  }

  const validTracks = [];

  items.forEach((item) => {
    const track = item.track;
    if (!track) return;

    if (track.album && track.album.release_date) {
      const releaseDate = track.album.release_date;
      const year = parseInt(releaseDate.substring(0, 4));

      if (!isNaN(year)) {
        validTracks.push({
          name: track.name,
          artist: track.artists.map((a) => a.name).join(", "),
          album: track.album.name,
          year: year,
          decade: Math.floor(year / 10) * 10,
        });
      }
    }
  });

  if (validTracks.length === 0) {
    throw new Error("No valid tracks found with release dates.");
  }

  renderCharts(validTracks);
}

function renderCharts(tracks) {
  const years = tracks.map((t) => t.year);
  const decades = tracks.map((t) => t.decade);

  const yearTrace = {
    x: years,
    type: "histogram",
    marker: { color: "#1DB954" },
    xbins: { size: 1 },
  };

  const yearLayout = {
    title: "Songs by Year",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#FFF" },
    margin: { t: 40, l: 40, r: 20, b: 40 },
    height: 400,
    xaxis: { title: "Year", tickmode: "linear", dtick: 1 },
    yaxis: { title: "Count" },
    bargap: 0.1,
    autosize: true,
  };

  Plotly.newPlot("year-chart", [yearTrace], yearLayout, { responsive: true });

  const decadeTrace = {
    x: decades,
    type: "histogram",
    marker: { color: "#33C1FF" },
    xbins: { size: 10 },
  };

  const decadeLayout = {
    title: "Songs by Decade",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#FFF" },
    margin: { t: 40, l: 40, r: 20, b: 40 },
    height: 400,
    xaxis: { title: "Decade", tickmode: "linear", dtick: 10 },
    yaxis: { title: "Count" },
    bargap: 0.1,
    autosize: true,
  };

  Plotly.newPlot("decade-chart", [decadeTrace], decadeLayout, {
    responsive: true,
  }).then(() => {
    window.dispatchEvent(new Event("resize"));
  });

  renderTable(tracks);
}

function renderTable(tracks) {
  tracks.sort((a, b) => a.year - b.year);

  const container = document.getElementById("songs-table-container");
  let html = `
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Song Name</th>
                    <th>Author</th>
                    <th>Album</th>
                    <th>Decade</th>
                </tr>
            </thead>
            <tbody>
    `;

  tracks.forEach((track) => {
    html += `
            <tr>
                <td>${track.year}</td>
                <td>${track.name}</td>
                <td>${track.artist}</td>
                <td>${track.album}</td>
                <td>${track.decade}s</td>
            </tr>
        `;
  });

  html += `
            </tbody>
        </table>
    `;

  container.innerHTML = html;
}
