import React from 'react';
import { useAppContext } from '../context/AppContext';
import DownloadIcon from './icons/DownloadIcon';

const PromptsPanel: React.FC = () => {
  const { state } = useAppContext();
  const { prompts, isLoading, generationProgress } = state;

  const handleDownload = () => {
    const content = prompts.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_prompts.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-inner h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-cyan-400">Gợi ý đã tạo</h3>
        <button
          onClick={handleDownload}
          disabled={prompts.length === 0}
          className="flex items-center px-3 py-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Tải xuống
        </button>
      </div>
      
      {generationProgress && (
        <div className="text-center mb-3 p-2 bg-gray-900 rounded-md">
          <p className="text-cyan-300 font-semibold animate-pulse">
            Đang tạo gợi ý {generationProgress.current} / {generationProgress.total}...
          </p>
        </div>
      )}

      <div className="flex-grow bg-gray-900 rounded-md p-3 overflow-y-auto border border-gray-700">
        {isLoading && prompts.length === 0 && !generationProgress ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : prompts.length === 0 ? (
          <p className="text-gray-500 text-center pt-8">Các gợi ý của bạn sẽ xuất hiện ở đây.</p>
        ) : (
          <ul className="space-y-3">
            {prompts.map((prompt, index) => (
              <li
                key={index}
                className="bg-gray-800 p-3 rounded-md text-gray-300 text-sm border-l-4 border-cyan-500"
              >
                <span className="font-mono text-gray-500 mr-2">{index + 1}.</span>
                {prompt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PromptsPanel;