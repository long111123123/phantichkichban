
import React from 'react';
import ShieldIcon from './icons/ShieldIcon';

const SafetyShield: React.FC = () => {
  return (
    <div className="bg-gray-900/50 border border-green-700/50 p-4 rounded-lg shadow-lg">
      <div className="flex items-center">
        <ShieldIcon className="w-8 h-8 text-green-400 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-green-400">Lá chắn an toàn AI</h3>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        Để đảm bảo kết quả an toàn và phù hợp, tất cả các yêu cầu đều được xử lý thông qua bộ lọc an toàn tích hợp của Gemini và các quy tắc nghiêm ngặt trong lời nhắc. Các gợi ý có thể được sửa đổi hoặc bỏ qua để tuân thủ chính sách.
      </p>
    </div>
  );
};

export default SafetyShield;
