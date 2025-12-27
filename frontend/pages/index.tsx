// frontend/pages/index.tsx
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [movingFile, setMovingFile] = useState<File | null>(null);
  const [stationaryFile, setStationaryFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSummary(null);
    
    if (!movingFile || !stationaryFile) {
      setError("Please select both CSV files.");
      return;
    }

    if (!movingFile.name.endsWith('.csv') || !stationaryFile.name.endsWith('.csv')) {
      setError("Please upload CSV files only.");
      return;
    }

    const formData = new FormData();
    formData.append("moving", movingFile);
    formData.append("stationary", stationaryFile);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || `Server error: ${res.statusText}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      setSegments(data.segments || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || "An error occurred while processing your files.");
      setSegments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: segments.map((_, idx) => `Segment ${idx + 1}`),
    datasets: [
      {
        label: "X-axis",
        data: segments.map((s) => s.mean[0]),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1,
      },
      {
        label: "Y-axis",
        data: segments.map((s) => s.mean[1]),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.1,
      },
      {
        label: "Z-axis",
        data: segments.map((s) => s.mean[2]),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
      {
        label: "SVM Prediction",
        data: segments.map((s) => s.prediction),
        borderColor: "rgba(0,0,0,0.5)",
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Motion Classification Analysis",
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>SmartMotion SVM Classifier</h1>
      <p>
        Upload two CSV files (Moving and Stationary) with X, Y, Z accelerometer data.
        The chart below shows per-segment mean values and SVM predictions.
      </p>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Moving CSV: 
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setMovingFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Stationary CSV: 
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setStationaryFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processing..." : "Analyze Motion"}
        </button>
      </form>
      
      {error && (
        <div style={{ 
          color: "red", 
          padding: "1rem", 
          backgroundColor: "#fee",
          borderRadius: "4px",
          marginBottom: "1rem"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {summary && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#e8f5e9",
          borderRadius: "4px",
          marginBottom: "1rem"
        }}>
          <h3>Analysis Summary</h3>
          <p>Total Segments: {summary.total_segments}</p>
          <p>Moving Segments: {summary.moving_segments}</p>
          <p>Stationary Segments: {summary.stationary_segments}</p>
          <p>Model Accuracy: {(summary.model_accuracy * 100).toFixed(2)}%</p>
          <p>Processing Time: {summary.processing_time_seconds}s</p>
        </div>
      )}
      
      {segments.length > 0 && (
        <div style={{ height: "500px", marginBottom: "1rem" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}