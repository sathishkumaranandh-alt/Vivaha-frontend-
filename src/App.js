import React from "react";
import Row from "./Row";
import Banner from "./Banner";
import Navbar from "./Navbar";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Navbar />
      <Banner />
      <Row title="Trending Now" fetchUrl="/trending/all/week" />
      <Row title="Top Rated" fetchUrl="/movie/top_rated" />
      <Row title="Tamil Movies" fetchUrl="/discover/movie?with_original_language=ta" />
      <Row title="Romance" fetchUrl="/discover/movie?with_genres=10749" />
    </div>
  );
}

export default App;
