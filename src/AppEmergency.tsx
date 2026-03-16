import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPageMinimal from "./pages/AuthPageMinimal";

const AppEmergency = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPageMinimal />} />
        <Route path="/*" element={<AuthPageMinimal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppEmergency;
