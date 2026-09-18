import React, { useEffect, useState } from "react";
import axios from "axios";

const baseURL = "https://api.themoviedb.org/3";
const API_KEY = "YOUR_TMDB_API_KEY"; // replace with your TMDB key

function Row({ title, fetchUrl }) {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const request = await axios.get(`${baseURL}${fetchUrl}&api_key=${API_KEY}`);
      setMovies(request.data.results);
    }
    fetchData();
  }, [fetchUrl]);

  return (
    <div className="row">
      <h2>{title}</h2>
      <div className="row-posters">
        {movies.map((movie) => (
          <img
            key={movie.id}
            className="row-poster"
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            alt={movie.name}
          />
        ))}
      </div>
    </div>
  );
}

export default Row;
        
