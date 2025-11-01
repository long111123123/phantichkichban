import React, { useState } from 'react';

const AiAnalysis: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-lg font-bold text-cyan-400 mb-2 flex justify-between items-center"
      >
        <span>Phân tích của Chuyên gia Kỹ thuật</span>
        <svg
          className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-6 text-gray-300">
          <div>
            <h4 className="text-md font-semibold text-green-400">Cải tiến Kiến trúc</h4>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li><span className="font-bold">Quản lý Trạng thái Tập trung:</span> Đã tái cấu trúc từ nhiều `useState` sang một `useReducer` duy nhất. Điều này giúp đơn giản hóa luồng dữ liệu, cải thiện hiệu suất bằng cách giảm các lần render lại không cần thiết và làm cho trạng thái ứng dụng dễ dự đoán hơn.</li>
              <li><span className="font-bold">Bảo mật API Key Nâng cao:</span> Việc lưu trữ khóa API đã được chuyển từ React State (có thể bị lộ) sang `localStorage` của trình duyệt, giảm đáng kể nguy cơ bị lộ khóa.</li>
              <li><span className="font-bold">Hủy bỏ Tác vụ An toàn:</span> Đã triển khai `AbortController` để hủy bỏ các yêu cầu AI đang chạy. Nếu bạn bắt đầu một hành động mới, hành động cũ sẽ dừng lại, giúp tiết kiệm quota API và ngăn ngừa các lỗi dữ liệu không nhất quán (race conditions).</li>
               <li><span className="font-bold">Độ bền bỉ của API:</span> Hệ thống phân phối tải và thử lại mạnh mẽ trên nhiều khóa API vẫn được duy trì, đảm bảo hoạt động trơn tru ngay cả khi một số khóa đạt đến giới hạn tốc độ.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold text-yellow-400">Các điểm cần cân nhắc hiện tại</h4>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
               <li><span className="font-bold">Bảo mật phía Client:</span> Mặc dù `localStorage` an toàn hơn React State, giải pháp bảo mật tối ưu nhất vẫn là một server trung gian (Backend-for-Frontend) để quản lý các khóa API hoàn toàn bên ngoài trình duyệt.</li>
              <li><span className="font-bold">Bộ nhớ đệm Phân tích:</span> Bộ nhớ đệm phân tích hiện tại hoạt động dựa trên toàn bộ nội dung kịch bản. Đối với các chỉnh sửa nhỏ, việc phân tích lại toàn bộ có thể không hiệu quả bằng một hệ thống phân tích theo từng phần (diff-based).</li>
              <li><span className="font-bold">Theo dõi Trạng thái AI:</span> Việc AI theo dõi các thay đổi trạng thái hình ảnh (ví dụ: một vết sẹo mới) là một bước tiến, nhưng nó vẫn có thể bỏ sót các chi tiết tinh vi trong các kịch bản rất dài hoặc phức tạp.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold text-cyan-400">Các bước tiếp theo tiềm năng</h4>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li><span className="font-bold">Backend-for-Frontend (BFF):</span> Triển khai một dịch vụ backend nhỏ để quản lý an toàn các khóa API, loại bỏ hoàn toàn các rủi ro bảo mật phía client.</li>
              <li><span className="font-bold">Thư viện Quản lý Trạng thái:</span> Đối với các ứng dụng lớn hơn, việc chuyển sang một thư viện như Zustand hoặc Redux Toolkit có thể cung cấp các tối ưu hóa hiệu suất bổ sung thông qua các selector được ghi nhớ (memoized selectors).</li>
              <li><span className="font-bold">Danh sách Ảo hóa (Virtualization):</span> Đối với các kịch bản rất dài tạo ra hàng trăm gợi ý, triển khai danh sách ảo hóa sẽ đảm bảo giao diện người dùng vẫn mượt mà bằng cách chỉ render các mục đang hiển thị.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysis;