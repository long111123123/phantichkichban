import React from 'react';
import { useAppContext } from '../context/AppContext';

const ScriptInput: React.FC = () => {
  const { state, dispatch } = useAppContext();
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-cyan-400 mb-2">Kịch bản của bạn</h3>
      <textarea
        value={state.script}
        onChange={(e) => dispatch({ type: 'SET_SCRIPT', payload: e.target.value })}
        rows={10}
        className="w-full h-64 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-500"
        placeholder="Dán kịch bản của bạn vào đây..."
      />
    </div>
  );
};

export default ScriptInput;