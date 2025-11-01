import React, { useState } from 'react';
// FIX: Import the 'Settings' type from the types file.
import type { ArtStyle, Settings } from '../types';
import { useAppContext } from '../context/AppContext';
import AddIcon from './icons/AddIcon';
import TrashIcon from './icons/TrashIcon';
import SafetyShield from './SafetyShield';

const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { settings, artStyles } = state;
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleTags, setNewStyleTags] = useState("");

  const handleAddStyle = () => {
    if (newStyleName && newStyleTags) {
      const newStyle: ArtStyle = {
        id: `custom-${Date.now()}`,
        name: "Custom",
        tags: `${newStyleName}, ${newStyleTags}`
      };
      dispatch({ type: 'SET_ART_STYLES', payload: [...artStyles, newStyle] });
      setNewStyleName("");
      setNewStyleTags("");
    }
  };
  
  const handleRemoveStyle = (id: string) => {
    dispatch({ type: 'SET_ART_STYLES', payload: artStyles.filter(style => style.id !== id) });
  };
  
  const safetyDescriptions: Record<Settings['safetyLevel'], string> = {
      maximum: "Chế độ nghiêm ngặt nhất, ưu tiên an toàn tuyệt đối. Biến đổi hoặc bỏ qua nội dung nhạy cảm.",
      cinematic_action: "Cho phép mô tả hành động và tác động mà không có máu me, phù hợp cho các cảnh chiến đấu.",
      indirect_suggestion: "Sử dụng ngôn ngữ ẩn dụ (ví dụ: 'nước màu đỏ' thay vì 'máu') để mô tả các cảnh bạo lực một cách gián tiếp, nghệ thuật."
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg space-y-6">
      <SafetyShield />
      
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-2">Tốc độ & Hiệu suất</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="wps" className="block text-sm font-medium text-gray-300">
              Tốc độ đọc (từ/giây)
            </label>
            <input
              id="wps"
              type="number"
              step="0.1"
              value={settings.wordsPerSecond}
              onChange={(e) => dispatch({ type: 'SET_SETTINGS', payload: { wordsPerSecond: parseFloat(e.target.value) || 0 } })}
              className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="interval" className="block text-sm font-medium text-gray-300">
              Tạo ảnh mới mỗi (giây)
            </label>
            <input
              id="interval"
              type="number"
              value={settings.imageIntervalSeconds}
              onChange={(e) => dispatch({ type: 'SET_SETTINGS', payload: { imageIntervalSeconds: parseInt(e.target.value) || 0 } })}
              className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
           <div>
            <label htmlFor="batchSize" className="block text-sm font-medium text-gray-300">
              Kích thước lô xử lý
            </label>
             <input
              id="batchSize"
              type="number"
              min="1"
              max="20"
              value={settings.batchSize}
              onChange={(e) => dispatch({ type: 'SET_SETTINGS', payload: { batchSize: parseInt(e.target.value) || 1 } })}
              className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
                Số phân đoạn trên mỗi lệnh gọi API. Tăng để giảm số lệnh gọi, giảm nếu gặp lỗi.
            </p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-2">Mức độ an toàn</h3>
        <select
            value={settings.safetyLevel}
            onChange={(e) => dispatch({ type: 'SET_SETTINGS', payload: { safetyLevel: e.target.value as Settings['safetyLevel'] } })}
            className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        >
            <option value="maximum">An toàn Tối đa</option>
            <option value="cinematic_action">Hành động Điện ảnh</option>
            <option value="indirect_suggestion">Gợi ý Gián tiếp</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
            {safetyDescriptions[settings.safetyLevel]}
        </p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-2">Phong cách nghệ thuật</h3>
        <select
            value={settings.selectedStyleId}
            onChange={(e) => dispatch({ type: 'SET_SETTINGS', payload: { selectedStyleId: e.target.value } })}
            className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        >
            {artStyles.map(style => (
                <option key={style.id} value={style.id}>
                    {style.name === "Custom" ? style.tags.split(',')[0] : style.name}
                </option>
            ))}
        </select>
        <div className="mt-4 p-3 bg-gray-900/50 rounded-md border border-gray-700">
          <p className="text-sm font-semibold text-gray-300">Thẻ phong cách:</p>
          <p className="text-xs text-cyan-300 break-words">{artStyles.find(s => s.id === settings.selectedStyleId)?.tags}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
          <h4 className="text-md font-bold text-cyan-400 mb-2">Thêm phong cách mới</h4>
          <input 
              type="text"
              placeholder="Tên phong cách (ví dụ: Giấc mơ màu nước)"
              value={newStyleName}
              onChange={(e) => setNewStyleName(e.target.value)}
              className="w-full mb-2 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <textarea 
              placeholder="Các thẻ mô tả (ví dụ: chuyển màu mềm, màu pastel, viền mực)"
              value={newStyleTags}
              onChange={(e) => setNewStyleTags(e.target.value)}
              rows={3}
              className="w-full mb-2 p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button onClick={handleAddStyle} className="w-full flex items-center justify-center p-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold transition-colors">
            <AddIcon className="w-5 h-5 mr-2" />
            Thêm phong cách
          </button>
          
          <h4 className="text-md font-bold text-cyan-400 mt-4 mb-2">Quản lý phong cách</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {artStyles.filter(s => s.name === "Custom").map(style => (
              <div key={style.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <p className="text-sm truncate pr-2">{style.tags.split(',')[0]}</p>
                  <button onClick={() => handleRemoveStyle(style.id)} className="text-red-400 hover:text-red-300">
                      <TrashIcon className="w-5 h-5"/>
                  </button>
              </div>
            ))}
          </div>

      </div>

    </div>
  );
};

export default SettingsPanel;