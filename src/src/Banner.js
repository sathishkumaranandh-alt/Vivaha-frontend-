import React, { useEffect, useState } from "react";
import axios from "axios";

const baseURL = "https://api.themoviedb.org/3";
const API_KEY = "YOUR_TMDB_API_KEY";

function Banner() {
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const request = await axios.get(`${baseURL}/trending/all/week?api_key=${API_KEY}`);
      setMovie(request.data.results[Math.floor(Math.random() * request.data.results.length)]);
    }
    fetchData();
  }, []);

  return (
    <header
      className="banner"
      style={{
        backgroundSize: "cover",
        backgroundImage: `url("https://image.tmdb.org/t/p/original${movie?.backdrop_path}")`,
        backgroundPosition: "center center",
      }}
    >
      <div className="banner-contents">
        <h1>{movie?.title || movie?.name}</h1>
        <p>{movie?.overview}</p>
        <div>
          <button className="banner-button">Play</button>
          <button className="banner-button">My List</button>
        </div>
      </div>
    </header>
  );
}

export default Banner;
