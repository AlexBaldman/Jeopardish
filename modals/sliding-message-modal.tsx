import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

const SmoothSlidingPanel = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);

  const togglePanel = () => setIsVisible(!isVisible);

  return (
    <div className="relative min-h-screen">
      <button
        onClick={togglePanel}
        className="fixed top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center"
      >
        <MessageCircle size={24} className="mr-2" />
        <span className="hidden sm:inline">Toggle Panel</span>
      </button>
      <div 
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-br from-blue-500 to-purple-600
          text-white p-6 shadow-lg transition-all duration-500 ease-in-out transform 
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Message Panel</h2>
            <button
              onClick={togglePanel}
              className="text-white hover:text-gray-200 transition-colors duration-200 transform hover:scale-110"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-grow overflow-auto">
            <p className="text-lg">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = () => (
  <header className="bg-gray-800 text-white p-4">
    <h1 className="text-2xl font-bold">My Super Cool Website</h1>
  </header>
);

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto mt-8 p-4">
        <h2 className="text-xl font-semibold mb-4">Main Content</h2>
        <p>Your website content goes here. Click the button in the top-right corner to toggle the sliding panel.</p>
      </main>
      <SmoothSlidingPanel message="Welcome to our amazing site! This panel can be triggered by various events. Currently, it's set to toggle when you click the message button in the top-right corner. Feel free to customize its behavior to suit your needs!" />
    </div>
  );
};

export default App;
