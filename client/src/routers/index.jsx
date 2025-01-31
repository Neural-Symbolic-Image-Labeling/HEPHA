import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../views/DashboardPage";
import { HomePage } from "../views/HomePage";
import { TestPage } from "../views/TestPage";
import { HomePageBaseline2 } from "../views/HomePageBaseline2";
import { HomePageBaseline3 } from "../views/HomePageBaseline3";

export const WebRouters = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tool2" element={<HomePageBaseline2 />} />
        <Route path="/tool3" element={<HomePageBaseline3 />} />
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
};
