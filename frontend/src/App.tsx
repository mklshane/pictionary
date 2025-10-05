import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import PlayerLobby from "./pages/PlayerLobby";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerLobby />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
