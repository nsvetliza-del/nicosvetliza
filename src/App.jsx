import React from "react";
import { Route, Routes } from "react-router-dom";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CustomCursor from "./components/CustomCursor";

export default function App() {
  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <div className="app-content">
        <CustomCursor />
        <Routes>
          <Route path="/" element={<Portfolio showIntro />} />
          <Route path="/project/:projectId" element={<Portfolio showIntro={false} />} />
          <Route path="/work" element={<Portfolio initialCategory="All" />} />
          <Route path="/work/:projectId" element={<Portfolio initialCategory="All" />} />
          <Route path="/films" element={<Portfolio initialCategory="Short Film" />} />
          <Route path="/films/:projectId" element={<Portfolio initialCategory="Short Film" />} />
          <Route path="/commercial" element={<Portfolio initialCategory="Commercial" />} />
          <Route
            path="/commercial/:projectId"
            element={<Portfolio initialCategory="Commercial" />}
          />
          <Route path="/advertising" element={<Portfolio initialCategory="Advertising" />} />
          <Route
            path="/advertising/:projectId"
            element={<Portfolio initialCategory="Advertising" />}
          />
          <Route path="/audiovisual" element={<Portfolio initialCategory="Audiovisual" />} />
          <Route
            path="/audiovisual/:projectId"
            element={<Portfolio initialCategory="Audiovisual" />}
          />
          <Route path="/music-videos" element={<Portfolio initialCategory="Music Video" />} />
          <Route
            path="/music-videos/:projectId"
            element={<Portfolio initialCategory="Music Video" />}
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </div>
  );
}
