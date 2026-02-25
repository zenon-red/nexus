import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { LazyMotion, domAnimation } from "motion/react";
import "./index.css";
import { quietSpacetimeLogs } from "./lib/quietSpacetimeLogs";

import { SpacetimeProvider } from "./spacetime/Provider";
import { Dashboard } from "./routes/Dashboard";
import { ActivityPage } from "./routes/ActivityPage";
import { IdeaPage } from "./routes/IdeaPage";
import { ProjectPage } from "./routes/ProjectPage";
import { IdeasListPage } from "./routes/IdeasListPage";
import { TasksListPage } from "./routes/TasksListPage";

quietSpacetimeLogs();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SpacetimeProvider>
        <LazyMotion features={domAnimation}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/ideas" element={<IdeasListPage />} />
            <Route path="/ideas/:id" element={<IdeaPage />} />
            <Route path="/tasks" element={<TasksListPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
          </Routes>
        </LazyMotion>
      </SpacetimeProvider>
    </BrowserRouter>
  </StrictMode>,
);
