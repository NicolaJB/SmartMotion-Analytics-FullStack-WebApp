// pages/index.tsx
"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [movingFile, setMovingFile] = useState<File | null>(null);
  const [stationaryFile, setStationaryFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!movingFile || !stationaryFile) {
      setError("Please select both CSV files.");
      return;
    }

    const formData = new FormData();
    formData.append("moving", movingFile);
    formData.append("stationary", stationaryFile);

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSegments(data.segments);
    } catch (err: any) {
      setError(err.message);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: segments.map((_, idx) => `Segment ${idx + 1}`),
    datasets: [
      {
        label: "X-axis",
        data: segments.map((s) => s.mean[0]),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
      },
      {
        label: "Y-axis",
        data: segments.map((s) => s.mean[1]),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
      },
      {
        label: "Z-axis",
        data: segments.map((s) => s.mean[2]),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
      {
        label: "SVM Prediction",
        data: segments.map((s) => s.prediction),
        borderColor: "rgba(0,0,0,0.5)",
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>SmartMotion SVM Classifier</h1>
      <p>
        Upload two CSV files (Moving and Stationary). The chart below shows
        per-segment mean values of X, Y, Z axes and SVM predictions (black dashed
        line).
      </p>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <div>
          <label>Moving CSV: </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setMovingFile(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <label>Stationary CSV: </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setStationaryFile(e.target.files?.[0] || null)}
          />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {segments.length > 0 && (
        <div style={{ maxWidth: "900px" }}>
          <Line data={chartData} />
          <p>
            **Instructions:** Colored lines represent mean X (red), Y (blue), Z
            (green) acceleration values per segment. The black dashed line shows the
            SVM prediction: 0 = moving, 1 = stationary. Peaks and troughs indicate
            motion intensity.
          </p>
        </div>
      )}
    </div>
  );
}
