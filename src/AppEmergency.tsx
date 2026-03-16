import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import { LanguageProvider } from "@/i18n/LanguageContext";

const AppEmergency = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default AppEmergency;
