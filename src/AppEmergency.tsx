import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";

const AppEmergency = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppEmergency;
