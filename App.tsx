import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import ApiKeyManager from './components/ApiKeyManager';
import ScriptInput from './components/ScriptInput';
import SettingsPanel from './components/SettingsPanel';
import AnalysisPanel from './components/AnalysisPanel';
import PromptsPanel from './components/PromptsPanel';
import AiAnalysis from './components/AiAnalysis';
import SparklesIcon from './components/icons/SparklesIcon';

const AppContent: React.FC = () => {
  const { 
    state,
    dispatch,
    handleAnalyze, 
    handleGenerate 
  } = useAppContext();

  const { error, isLoading } = state;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Trình tạo gợi ý AI cho kịch bản phân cảnh
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Biến kịch bản của bạn thành các gợi ý hình ảnh nhất quán, chất lượng cao.
          </p>
        </header>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Lỗi: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Inputs & Settings */}
          <div className="lg:col-span-3 space-y-6">
            <ApiKeyManager />
            <ScriptInput />
            <SettingsPanel />
            <AiAnalysis />
          </div>

          {/* Middle Columns: Analysis */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalysisPanel title="Nhân vật" entityType="character" />
            <AnalysisPanel title="Môi trường" entityType="environment" />
          </div>
          
          {/* Right Column: Prompts */}
          <div className="lg:col-span-3 flex flex-col">
            <PromptsPanel />
          </div>
        </main>
        
        {/* Action Buttons Footer */}
        <footer className="mt-6 p-4 bg-gray-900/80 backdrop-blur-sm sticky bottom-4 rounded-xl border border-gray-700 shadow-2xl flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-wait"
            >
                <SparklesIcon className="w-5 h-5"/>
                1. Phân tích kịch bản
            </button>
            <button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-wait"
            >
                <SparklesIcon className="w-5 h-5"/>
                2. Tạo gợi ý
            </button>
        </footer>
      </div>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;