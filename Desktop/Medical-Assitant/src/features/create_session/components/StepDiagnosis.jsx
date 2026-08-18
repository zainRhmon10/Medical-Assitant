import { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Mic,
  Upload,
} from "lucide-react";
import FileUploader from "./FileUploader";

const StepDiagnosis = ({ formik, onNext, onBack }) => {
  const [activeTab, setActiveTab] = useState("record");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        formik.setFieldValue("diagnosisAudio", url);
        formik.setFieldValue("recordingDuration", recordingTime);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (e) {
      alert("يرجى السماح بالوصول للمايكروفون");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    formik.setFieldValue("diagnosisAudio", null);
    formik.setFieldValue("recordingDuration", 0);
  };

  return (
    <div className="space-y-6 bg-white p-4 my-10  rounded-xl">
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
            activeTab === "upload"
              ? "bg-[#0b7a9e] text-white"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <Upload className="h-4 w-4" />
          رفع ملف
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("record")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
            activeTab === "record"
              ? "bg-primary text-white"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <Mic className="h-4 w-4" />
          تسجيل مباشر
        </button>
      </div>

      {activeTab === "record" ? (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleRecordToggle}
            className={`flex h-24 w-24 items-center justify-center rounded-full border-2 transition ${
              isRecording
                ? "border-red-400 bg-red-50 text-red-500 animate-pulse"
                : audioUrl
                  ? "border-[#0b7a9e] bg-[#0b7a9e]/5 text-[#0b7a9e]"
                  : "border-[#0b7a9e] text-[#0b7a9e] hover:bg-[#0b7a9e]/5"
            }`}
          >
            {isRecording ? (
              <Square className="h-8 w-8 fill-current" />
            ) : (
              <Play className="h-8 w-8 fill-current" />
            )}
          </button>

          <p className="text-sm text-slate-600">
            {isRecording
              ? "جاري التسجيل..."
              : audioUrl
                ? "انتهى التسجيل"
                : "انقر للتسجيل"}
          </p>

          {/* المؤقت */}
          <p className="text-2xl font-bold text-slate-800 font-mono">
            {formatTime(recordingTime)}
          </p>

          {/* شريط الصوت */}
          <div className="h-16 w-full max-w-md rounded-xl bg-slate-50 overflow-hidden relative">
            {isRecording && (
              <div className="flex h-full items-center justify-center px-4">
                <div className="h-2 w-full bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-red-400 animate-pulse" />
                </div>
              </div>
            )}

            {audioUrl && !isRecording && (
              <div className="flex items-end justify-center gap-1 h-full px-4 py-2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-[#0b7a9e]/30"
                    style={{
                      height: `${Math.random() * 100}%`,
                      opacity: 0.3 + Math.random() * 0.7,
                    }}
                  />
                ))}
              </div>
            )}

            {!audioUrl && !isRecording && (
              <div className="flex items-end justify-center gap-1 h-full px-4 py-2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-[#0b7a9e]/30"
                    style={{
                      height: `${Math.random() * 100}%`,
                      opacity: 0.3 + Math.random() * 0.7,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex w-full max-w-md gap-3">
            <button
              type="button"
              onClick={resetRecording}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="inline h-4 w-4 ms-2" />
              إعادة التسجيل
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!audioUrl}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b7a9e] py-3 text-sm font-semibold text-white transition hover:bg-[#0B4658] disabled:opacity-50"
            >
              التالي: إرسال للمعالجة
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </button>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <FileUploader
            onFileSelect={(file) => {
              const url = URL.createObjectURL(file);
              setAudioUrl(url);
              formik.setFieldValue("diagnosisAudio", url);
              formik.setFieldValue("recordingDuration", 0);
            }}
            onClear={() => {
              setAudioUrl(null);
              formik.setFieldValue("diagnosisAudio", null);
              formik.setFieldValue("recordingDuration", 0);
            }}
          />

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onNext}
              disabled={!audioUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b7a9e] py-3 text-sm font-semibold text-white transition hover:bg-[#0B4658] disabled:opacity-50"
            >
              التالي: إرسال للمعالجة
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepDiagnosis;
