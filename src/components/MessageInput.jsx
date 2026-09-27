
import { useRef, useState } from "react";

function MessageInput({
  text,
  handleTextChange,
  handleKeyDown,
  sendMessage,
  handleFileChange,
  selectedFile,
  removeSelectedFile,
  darkMode,
}) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size 10 MB se kam honi chahiye.");
      e.target.value = "";
      return;
    }

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }

    handleFileChange?.(file);
  };

  const handleRemoveFile = () => {
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    removeSelectedFile?.();
  };

  return (
    <div className={`border-t p-3 md:p-4 ${
      darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
    }`}>
      {selectedFile && (
        <div className={`mb-3 flex items-center gap-3 rounded-xl p-3 ${
          darkMode ? "bg-slate-800" : "bg-slate-100"
        }`}>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
          ) : (
            <div className="text-3xl">📄</div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button type="button" onClick={handleRemoveFile} className="text-red-500 hover:text-red-400 text-xl px-2">
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2 md:gap-3 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`px-4 py-3 rounded-xl transition ${
            darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
          title="Attach image or file"
        >
          📎
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className={`flex-1 min-w-0 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode
              ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
              : "bg-white border-slate-300 text-slate-800"
          }`}
        />

        <button
          onClick={sendMessage}
          disabled={!text.trim() && !selectedFile}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white px-4 md:px-6 rounded-xl font-semibold transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default MessageInput;