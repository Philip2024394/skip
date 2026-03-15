import { useState } from "react";

const DebugWorldMap = () => {
  const [count, setCount] = useState(0);
  
  console.log('🗺️ DebugWorldMap component loaded');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">World Map Debug</h1>
      <p className="text-xl mb-4">This is a debug version of World Map.</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Count: {count}
      </button>
      <div className="mt-4">
        <a href="/admin" className="text-blue-400 underline">← Back to Admin</a>
      </div>
    </div>
  );
};

export default DebugWorldMap;
