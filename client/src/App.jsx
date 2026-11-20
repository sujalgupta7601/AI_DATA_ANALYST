
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import DatasetDashboard from "./pages/DatasetDashboard";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import AIChat from "./pages/AIChat";
import DatasetAIChat from "./pages/DatasetAIChat";
import { getAllDatasets } from "./services/api";
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datasetId, setDatasetId] = useState(() => {
    return localStorage.getItem("datapilot_dataset_id") || null;
  });
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    async function restoreDataset() {
      try {
        const response = await getAllDatasets();
        const savedDatasets = response.data || [];

        setDatasets(savedDatasets);

        const savedId = localStorage.getItem(
          "datapilot_dataset_id"
        );

        if (
          savedId &&
          savedDatasets.some((dataset) => dataset.id === savedId)
        ) {
          setDatasetId(savedId);
        } else if (savedDatasets.length > 0) {
          setDatasetId(savedDatasets[0].id);
          localStorage.setItem(
            "datapilot_dataset_id",
            savedDatasets[0].id
          );
        } else {
          setDatasetId(null);
          localStorage.removeItem(
            "datapilot_dataset_id"
          );
        }
      } catch (error) {
        console.error(
          "Failed to restore datasets:",
          error
        );
      }
    }

    restoreDataset();
  }, []);
  useEffect(() => {
    if (datasetId) {
      localStorage.setItem(
        "datapilot_dataset_id",
        datasetId
      );
    } else {
      localStorage.removeItem(
        "datapilot_dataset_id"
      );
    }
  }, [datasetId]);
  return (
    <div className="min-h-screen bg-[#080d19] text-slate-100">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-slate-800 bg-[#080d19]/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
              <Search size={17} />
              <span>AI-powered analytics workspace</span>
            </div>

            <span className="text-sm font-semibold sm:hidden">
              DataPilot AI
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 sm:block">
              Demo Workspace
            </span>

            <Bell size={19} className="text-slate-400" />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
              D
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 md:p-8">
          <Routes>
            <Route
              path="/"
              element={
                datasetId ? (
                  <DatasetDashboard datasetId={datasetId} />
                ) : (
                  <Dashboard />
                )
              }
            />

            <Route
              path="/datasets"
              element={
                <Datasets
                  datasetId={datasetId}
                  setDatasetId={setDatasetId}
                />
              }
            />

            <Route
              path="/chat"
              element={
                datasetId ? (
                  <DatasetAIChat
                    key={datasetId}
                    datasetId={datasetId}
                  />
                ) : (
                  <AIChat />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>
      </div>
    </div>
  );
}
