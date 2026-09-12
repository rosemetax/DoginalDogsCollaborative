import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Error boundary: if anything crashes, show the message on screen
// (so problems are visible even without the browser console).
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("App crashed:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#f8e49e", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: 520, background: "#fff", borderRadius: 16, padding: 24, border: "2px solid #8d6a49" }}>
            <div style={{ fontWeight: 800, color: "#624a33", fontSize: 18, marginBottom: 8 }}>Something went wrong loading the notebook</div>
            <p style={{ color: "#8d6a49", fontSize: 14, marginBottom: 12 }}>
              Try reloading. If it keeps happening, screenshot the message below and send it.
            </p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#fdf6d8", padding: 12, borderRadius: 8, fontSize: 12, color: "#7a1f1f", overflow: "auto" }}>
              {String(this.state.error?.message || this.state.error)}
              {"\n\n"}
              {String(this.state.error?.stack || "").split("\n").slice(0, 4).join("\n")}
            </pre>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button onClick={() => window.location.reload()} style={{ background: "#8d6a49", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Reload</button>
              <button onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }} style={{ background: "#fff", color: "#8d6a49", border: "2px solid #8d6a49", padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Sign out and reset</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
