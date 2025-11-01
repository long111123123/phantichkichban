import React from 'react';
import { useAppContext } from '../context/AppContext';

const ApiKeyManager: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_API_KEYS', payload: e.target.value.split('\n').filter(Boolean) });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-cyan-400 mb-2">Khóa API Gemini</h3>
      <p className="text-sm text-gray-400 mb-3">
        Nhập mỗi khóa trên một dòng. Các khóa được lưu trữ trong bộ nhớ cục bộ của trình duyệt và không bao giờ được chia sẻ.
      </p>
      <textarea
        value={state.apiKeys.join('\n')}
        onChange={handleKeyChange}
        rows={4}
        className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-500"
        placeholder="Nhập các khóa API Gemini của bạn tại đây..."
      />
      <p className="text-xs text-gray-500 mt-2">
        {state.apiKeys.length} khóa đã được tải.
      </p>
    </div>
  );
};

export default ApiKeyManager;