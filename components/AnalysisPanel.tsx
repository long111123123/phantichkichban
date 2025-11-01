import React from 'react';
import type { Entity } from '../types';
import { useAppContext } from '../context/AppContext';
import LockIcon from './icons/LockIcon';
import UnlockIcon from './icons/UnlockIcon';

interface AnalysisPanelProps {
  title: string;
  entityType: 'character' | 'environment';
}

const EntityCard: React.FC<{
  entity: Entity;
  onUpdate: (updatedEntity: Entity) => void;
  isRecentlyUpdated: boolean;
}> = ({ entity, onUpdate, isRecentlyUpdated }) => {
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...entity, description: e.target.value });
  };
  
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...entity, aliases: e.target.value.split(',').map(a => a.trim()) });
  };


  const toggleLock = () => {
    onUpdate({ ...entity, isLocked: !entity.isLocked });
  };

  return (
    <div className={`bg-gray-800 p-3 rounded-lg border ${isRecentlyUpdated ? 'border-yellow-400 motion-safe:animate-pulse' : 'border-gray-700'} transition-colors duration-500`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-cyan-300">{entity.name}</h4>
        <button
          onClick={toggleLock}
          className={`p-1 rounded-full transition-colors ${
            entity.isLocked ? 'text-yellow-400 hover:bg-yellow-400/20' : 'text-gray-400 hover:bg-gray-600'
          }`}
          title={entity.isLocked ? 'Mở khóa mô tả' : 'Khóa mô tả'}
        >
          {entity.isLocked ? <LockIcon className="w-5 h-5" /> : <UnlockIcon className="w-5 h-5" />}
        </button>
      </div>
      <textarea
        value={entity.description}
        onChange={handleDescriptionChange}
        rows={3}
        className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        placeholder="Mô tả hình ảnh..."
      />
      <div className="mt-2">
        <label className="text-xs text-gray-400">Bí danh (phân tách bằng dấu phẩy)</label>
        <input
          type="text"
          value={entity.aliases.join(', ')}
          onChange={handleAliasChange}
          className="w-full mt-1 p-2 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          placeholder="ví dụ: anh ấy, vị vua, người lính..."
        />
      </div>
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ title, entityType }) => {
  const { state, dispatch } = useAppContext();
  const { characters, environments, recentlyUpdatedEntityIds } = state;

  const entities = entityType === 'character' ? characters : environments;
  const actionType = entityType === 'character' ? 'UPDATE_CHARACTERS' : 'UPDATE_ENVIRONMENTS';

  const handleUpdateEntity = (updatedEntity: Entity) => {
    const updatedEntities = entities.map(e => (e.id === updatedEntity.id ? updatedEntity : e));
    dispatch({ type: actionType, payload: updatedEntities });
  };



  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-inner h-full">
      <h3 className="text-xl font-bold text-cyan-400 mb-4">{title}</h3>
      {entities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Chạy phân tích để xem kết quả.</p>
      ) : (
        <div className="space-y-3 overflow-y-auto h-[calc(100%-2.5rem)] pr-2">
          {entities.map(entity => (
            <EntityCard 
              key={entity.id} 
              entity={entity} 
              onUpdate={handleUpdateEntity}
              isRecentlyUpdated={recentlyUpdatedEntityIds.includes(entity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;