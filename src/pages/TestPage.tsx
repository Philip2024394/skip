import { useState } from "react";

const TestPage = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-xl mb-4">This is a test page to verify routing works.</p>
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

export default TestPage;
