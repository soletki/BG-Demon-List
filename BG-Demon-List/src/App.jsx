import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";

function App() {
  return (
    <Router>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Pointercrate Clone</h1>
        <Routes>
          <Route path="/" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
