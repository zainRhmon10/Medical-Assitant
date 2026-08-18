import { useState, useRef } from "react";

import { useTranslation } from "react-i18next";

import { Upload, FileAudio, X, AlertCircle } from "lucide-react";

const ALLOWED_EXTENSIONS = [
  "wav",
  "mp3",
  "m4a",
  "ogg",
  "flac",
  "webm",
  "mp4",
  "mpeg",
  "mpga",
  "oga",
  "opus",
  "aac",
  "amr",
  "wma",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const FileUploader = ({ onFileSelect, onClear }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const inputRef = useRef(null);

  const getFileExtension = (fileName) => {
    if (!fileName || !fileName.includes(".")) {
      return "";
    }

    return fileName.split(".").pop().toLowerCase();
  };

  const validateFile = (file) => {
    if (!file) {
      return false;
    }

    const extension = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError(t("createSession.audio.errors.invalidType"));
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(t("createSession.audio.errors.fileTooLarge"));
      return false;
    }

    if (file.size === 0) {
      setFileError(t("createSession.audio.errors.emptyFile"));
      return false;
    }

    setFileError("");
    return true;
  };

  const selectFile = (file) => {
    if (!validateFile(file)) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();

    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (file) {
      selectFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onClear?.();
  };

  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-full">
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 transition ${
              isDragging
                ? "border-primary bg-primary/5"
                : fileError
                  ? "border-red-300 bg-red-50/30"
                  : "border-slate-200 bg-slate-50 hover:border-blue-200"
            }`}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                isDragging
                  ? "bg-[#0b7a9e] text-white"
                  : fileError
                    ? "bg-red-50 text-red-400"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              <Upload className="h-6 w-6" />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {t("createSession.audio.uploader.dragHere")}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {t("createSession.audio.uploader.clickToChoose")}
              </p>
            </div>

            <p
              className="
                max-w-lg
                text-center
                text-xs
                leading-5
                text-slate-400
              "
            >
              {t("createSession.audio.uploader.formats")}
            </p>

            <p className="text-xs font-medium text-slate-500">
              {t("createSession.audio.uploader.maxSize")}
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".wav,.mp3,.m4a,.ogg,.flac,.webm,.mp4,.mpeg,.mpga,.oga,.opus,.aac,.amr,.wma,audio/*"
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

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {selectedFile.name}
              </p>

              <p className="text-xs text-slate-400" dir="ltr">
                {(selectedFile.size / 1024 / 1024).toFixed(2)}

                {" MB"}
              </p>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                clearFile();
              }}
              title={t("createSession.audio.uploader.remove")}
              className="text-slate-400 transition hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/*  عرض خطأ الملف تحت منطقة الرفع. */}

        {fileError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p className="text-xs leading-5">{fileError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
