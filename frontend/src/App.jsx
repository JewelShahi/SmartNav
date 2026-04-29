import React from "react";

const App = () => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Tailwind + DaisyUI Test</h2>
          <p>If this looks styled, everything works.</p>

          <button className="btn btn-primary">
            Click me
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;