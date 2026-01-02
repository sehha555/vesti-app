import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// 真實的 Supabase 使用者 UUID
// TODO: 未來改成從認證系統 (如 Supabase Auth) 取得 userId
const REAL_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileUploadState {
  file: File;
  preview: string;
  status: UploadStatus;
  error?: string;
  name?: string; // 自訂名稱
  type?: string; // 自訂類型
}

interface BatchUploadDialogProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onComplete: () => void; // 上傳完成後重新載入衣櫃
}

export function BatchUploadDialog({ isOpen, files, onClose, onComplete }: BatchUploadDialogProps) {
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>(() =>
    files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as UploadStatus,
    }))
  );

  // 統一設定
  const [namePrefix, setNamePrefix] = useState('');
  const [clothingType, setClothingType] = useState<string>('top');
  const [isUploading, setIsUploading] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // 統計資訊
  const successCount = uploadStates.filter((s) => s.status === 'success').length;
  const errorCount = uploadStates.filter((s) => s.status === 'error').length;
  const totalCount = uploadStates.length;
  const isComplete = successCount + errorCount === totalCount;

  // 批次上傳
  const handleBatchUpload = async () => {
    setIsUploading(true);
    toast('批次上傳開始', { icon: '' });

    for (let i = 0; i < uploadStates.length; i++) {
      const state = uploadStates[i];

      // 跳過已經成功的
      if (state.status === 'success') continue;

      // 更新狀態為上傳中
      setUploadStates((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'uploading' as UploadStatus } : s))
      );

      try {
        // 準備 FormData
        const formData = new FormData();
        formData.append('file', state.file);
        formData.append('userId', REAL_USER_ID);

        // 決定名稱：進階模式用自訂名稱，否則用前綴+編號
        const itemName = isAdvancedMode && state.name
          ? state.name
          : namePrefix
          ? `${namePrefix} ${i + 1}`
          : `衣物 ${i + 1}`;
        formData.append('name', itemName);

        // 決定類型
        const itemType = isAdvancedMode && state.type ? state.type : clothingType;
        formData.append('type', itemType);

        // 呼叫 API
        const response = await fetch('/api/wardrobe/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '上傳失敗' }));
          throw new Error(errorData.message || `上傳失敗: ${response.status}`);
        }

        // 成功
        setUploadStates((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'success' as UploadStatus } : s))
        );
      } catch (error) {
        // 失敗
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        setUploadStates((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error' as UploadStatus, error: errorMessage } : s
          )
        );
      }

      // 短暫延遲，避免過快
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsUploading(false);
    toast.success(`批次上傳完成！成功 ${successCount + 1} 張`);
  };

  // 完成並關閉
  const handleFinish = () => {
    // 清理 preview URLs
    uploadStates.forEach((state) => URL.revokeObjectURL(state.preview));
    onComplete(); // 重新載入衣櫃
    onClose();
  };

  // 更新單一檔案的名稱（進階模式）
  const updateFileName = (index: number, name: string) => {
    setUploadStates((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, name } : s))
    );
  };

  // 更新單一檔案的類型（進階模式）
  const updateFileType = (index: number, type: string) => {
    setUploadStates((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, type } : s))
    );
  };

  // 進度百分比
  const progress = totalCount > 0 ? Math.round(((successCount + errorCount) / totalCount) * 100) : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={!isUploading ? onClose : undefined}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-[var(--vesti-dark)]">批次上傳設定</h2>
                <p className="text-sm text-[var(--vesti-gray-mid)] mt-1">
                  已選擇 {totalCount} 張圖片
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* 進度條（上傳中或完成時顯示） */}
              {(isUploading || isComplete) && (
                <div className="mb-5 p-4 bg-[var(--vesti-secondary)] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--vesti-dark)]">
                      上傳進度
                    </span>
                    <span className="text-sm text-[var(--vesti-gray-mid)]">
                      {progress}% ({successCount + errorCount}/{totalCount})
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--vesti-primary)] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {isComplete && (
                    <p className="text-sm text-center mt-3 text-[var(--vesti-dark)]">
                      成功上傳 <strong>{successCount}</strong> 張
                      {errorCount > 0 && (
                        <span className="text-red-600">，失敗 <strong>{errorCount}</strong> 張</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* 統一設定區（未開始上傳時顯示） */}
              {!isUploading && !isComplete && (
                <div className="mb-5 p-4 bg-[var(--vesti-secondary)] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[var(--vesti-dark)]">統一設定</h3>
                    <button
                      onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                      className="text-xs text-[var(--vesti-primary)] hover:underline"
                    >
                      {isAdvancedMode ? '切換到統一設定' : '切換到逐張設定'}
                    </button>
                  </div>

                  {!isAdvancedMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 名稱前綴 */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--vesti-gray-mid)] mb-1">
                          名稱前綴
                        </label>
                        <input
                          type="text"
                          value={namePrefix}
                          onChange={(e) => setNamePrefix(e.target.value)}
                          placeholder="例如：春季上衣"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vesti-primary)] focus:border-transparent"
                        />
                      </div>

                      {/* 衣物類型 */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--vesti-gray-mid)] mb-1">
                          衣物類型
                        </label>
                        <select
                          value={clothingType}
                          onChange={(e) => setClothingType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vesti-primary)] focus:border-transparent"
                        >
                          <option value="top">上衣</option>
                          <option value="bottom">下身</option>
                          <option value="outerwear">外套</option>
                          <option value="shoes">鞋子</option>
                          <option value="accessory">配件</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 圖片預覽 Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {uploadStates.map((state, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50"
                  >
                    {/* 圖片 */}
                    <img
                      src={state.preview}
                      alt={`預覽 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* 狀態覆蓋 */}
                    {state.status !== 'pending' && (
                      <div
                        className={`absolute inset-0 flex items-center justify-center ${
                          state.status === 'uploading'
                            ? 'bg-black/30'
                            : state.status === 'success'
                            ? 'bg-green-500/20'
                            : 'bg-red-500/20'
                        }`}
                      >
                        {state.status === 'uploading' && (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        )}
                        {state.status === 'success' && (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        )}
                        {state.status === 'error' && (
                          <XCircle className="w-8 h-8 text-red-600" />
                        )}
                      </div>
                    )}

                    {/* 進階模式：單獨設定 */}
                    {isAdvancedMode && !isUploading && !isComplete && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                        <input
                          type="text"
                          value={state.name || ''}
                          onChange={(e) => updateFileName(index, e.target.value)}
                          placeholder={`名稱 ${index + 1}`}
                          className="w-full px-2 py-1 text-xs rounded mb-1 focus:outline-none focus:ring-1 focus:ring-[var(--vesti-primary)]"
                        />
                        <select
                          value={state.type || clothingType}
                          onChange={(e) => updateFileType(index, e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded focus:outline-none focus:ring-1 focus:ring-[var(--vesti-primary)]"
                        >
                          <option value="top">上衣</option>
                          <option value="bottom">下身</option>
                          <option value="outerwear">外套</option>
                          <option value="shoes">鞋子</option>
                          <option value="accessory">配件</option>
                        </select>
                      </div>
                    )}

                    {/* 錯誤訊息（hover 顯示） */}
                    {state.status === 'error' && state.error && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-600 text-white text-xs">
                        {state.error}
                      </div>
                    )}

                    {/* 編號標籤 */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)] transition-colors disabled:opacity-50"
              >
                取消
              </button>

              {!isComplete ? (
                <button
                  onClick={handleBatchUpload}
                  disabled={isUploading || (!namePrefix && !isAdvancedMode)}
                  className="px-6 py-2 bg-[var(--vesti-primary)] text-white rounded-lg font-medium hover:bg-[var(--vesti-primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      開始批次上傳
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-6 py-2 bg-[var(--vesti-accent)] text-white rounded-lg font-medium hover:bg-[var(--vesti-accent)]/90 transition-colors"
                >
                  完成
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
