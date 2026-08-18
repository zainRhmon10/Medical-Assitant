import { useState, useRef } from "react";
import { Upload, FileAudio, X } from "lucide-react";

const FileUploader = ({ onFileSelect, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("يرجى رفع ملف صوتي فقط");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  return (
    <div className="w-full felx justify-center items-center ">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 transition cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-slate-200 bg-slate-50 hover:border-blue-200"
          }`}
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
              isDragging
                ? "bg-[#0b7a9e] text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">اسحب الملف هنا</p>
            <p className="mt-1 text-xs text-slate-400">
              أو انقر للاختيار من الجهاز
            </p>
          </div>
          <p className="text-xs text-slate-400">MP3, WAV, WEBM حتى 10MB</p>

          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        /* ─── عرض الملف المختار ─── */
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileAudio className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="text-slate-400 hover:text-red-500 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
