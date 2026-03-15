import { useState } from "react";

const DebugWhatsAppLeads = () => {
  const [count, setCount] = useState(0);
  
  console.log('🔍 DebugWhatsAppLeads component loaded');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">WhatsApp Leads Debug</h1>
      <p className="text-xl mb-4">This is a debug version of WhatsApp Leads.</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Count: {count}
      </button>
      <div className="mt-4">
        <a href="/admin" className="text-green-400 underline">← Back to Admin</a>
      </div>
    </div>
  );
};

export default DebugWhatsAppLeads;
