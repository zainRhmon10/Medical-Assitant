import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  Square,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Mic,
  Upload,
  AlertCircle,
  FileAudio,
} from "lucide-react";
import FileUploader from "./FileUploader";

const StepDiagnosis = ({ formik, onNext, onBack }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");
  const [activeTab, setActiveTab] = useState("record");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [audioUrl, setAudioUrl] = useState(null);

  const [recordingError, setRecordingError] = useState("");
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const recordingTimeRef = useRef(0);

  const audioUrlRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60).toString().padStart(2, "0");

    return `${mins}:${secs}`;
  };

  /*
   * Recording Timer
   */

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;

          recordingTimeRef.current = next;

          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  /*
   * Cleanup
   */

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }

      clearInterval(timerRef.current);

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const setAudioPreview = (file) => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    audioUrlRef.current = url;

    setAudioUrl(url);
  };

  /*
   * Recording MIME Type
   */
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === "undefined") {
      return "";
    }

    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    return (
      mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ||
      ""
    );
  };

  const startRecording = async () => {
    setRecordingError("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setRecordingError(t("createSession.audio.errors.notSupported"));

      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = getSupportedMimeType();

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      formik.setFieldValue("diagnosisAudio", null, false);
      formik.setFieldValue("recordingDuration", 0, false);

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);

        audioUrlRef.current = null;
      }
      setAudioUrl(null);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMimeType = mediaRecorder.mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        const extension = finalMimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File(
          [blob],
          `clinical-visit-${Date.now()}.${extension}`,
          {
            type: finalMimeType,
            lastModified: Date.now(),
          },
        );

        setAudioPreview(file);

        formik.setFieldValue("diagnosisAudio", file, false);

        formik.setFieldValue(
          "recordingDuration",
          recordingTimeRef.current,
          false,
        );

        formik.setFieldError("diagnosisAudio", undefined);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = () => {
        setRecordingError(t("createSession.audio.errors.recordingFailed"));
      };

      mediaRecorder.start();

      setIsRecording(true);
    } catch (error) {
      console.error("MICROPHONE ERROR:", error);

      if (
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError"
      ) {
        setRecordingError(t("createSession.audio.errors.permissionDenied"));

        return;
      }

      setRecordingError(t("createSession.audio.errors.microphoneFailed"));
    }
  };

  /*
   * Stop Recording
   */

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      setIsRecording(false);
    }
  };

  /*
   * Record Toggle
   */

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /*
   * Reset Recording
   */

  const resetRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);

      audioUrlRef.current = null;
    }

    setAudioUrl(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setIsRecording(false);
    setRecordingError("");
    formik.setFieldValue("diagnosisAudio", null, false);
    formik.setFieldValue("recordingDuration", 0, false);
  };

  /*
   * Change Tab
   */

  const handleTabChange = (tab) => {
    if (isRecording) {
      return;
    }
    setRecordingError("");
    setActiveTab(tab);
  };

  /*
   * Uploaded File
   */

  const handleUploadedFile = (file) => {
    setRecordingError("");
    setAudioPreview(file);
    formik.setFieldValue("diagnosisAudio", file, false);
    formik.setFieldValue("recordingDuration", 0, false);
    formik.setFieldError("diagnosisAudio", undefined);
  };

  const handleClearUploadedFile = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);

      audioUrlRef.current = null;
    }
    setAudioUrl(null);
    formik.setFieldValue("diagnosisAudio", null, false);
    formik.setFieldValue("recordingDuration", 0, false);
  };

  const handleNext = () => {
    if (!formik.values.diagnosisAudio) {
      formik.setFieldTouched("diagnosisAudio", true, false);

      return;
    }
    onNext();
  };

  return (
    <div
      className="
        my-10
        space-y-6
        rounded-xl
        bg-white
        p-4
      "
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/*  Tabs  */}

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("upload")}
          disabled={isRecording}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            activeTab === "upload"
              ? "bg-[#0b7a9e] text-white"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <Upload className="h-4 w-4" />

          {t("createSession.audio.uploadTab")}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("record")}
          disabled={isRecording}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            activeTab === "record"
              ? "bg-primary text-white"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <Mic className="h-4 w-4" />

          {t("createSession.audio.recordTab")}
        </button>
      </div>

      {/*  Error*/}

      {recordingError && (
        <div
          className="
            flex
            items-start
            gap-2
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-red-600
          "
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <p className="text-sm">{recordingError}</p>
        </div>
      )}

      {/*  Record  */}

      {activeTab === "record" ? (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleRecordToggle}
            className={`flex h-24 w-24 items-center justify-center rounded-full border-2 transition ${
              isRecording
                ? "animate-pulse border-red-400 bg-red-50 text-red-500"
                : audioUrl
                  ? "border-[#0b7a9e] bg-[#0b7a9e]/5 text-[#0b7a9e]"
                  : "border-[#0b7a9e] text-[#0b7a9e] hover:bg-[#0b7a9e]/5"
            }`}
          >
            {isRecording ? (
              <Square className="h-8 w-8 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>

          <p className="text-sm text-slate-600">
            {isRecording
              ? t("createSession.audio.recording")
              : audioUrl
                ? t("createSession.audio.recordingFinished")
                : t("createSession.audio.clickToRecord")}
          </p>

          {/* المؤقت */}

          <p
            className="
              font-mono
              text-2xl
              font-bold
              text-slate-800
            "
            dir="ltr"
          >
            {formatTime(recordingTime)}
          </p>

          {/* شريط الصوت */}

          <div className="relative h-16 w-full max-w-md overflow-hidden rounded-xl bg-slate-50">
            {isRecording && (
              <div className="flex h-full items-center justify-center px-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-red-100">
                  <div className="h-full w-full animate-pulse bg-red-400" />
                </div>
              </div>
            )}

            {!isRecording && !audioUrl && (
              <div className="flex h-full items-center justify-center">
                <Mic className="h-6 w-6 text-slate-300" />
              </div>
            )}

            {!isRecording && audioUrl && (
              <div className="flex h-full items-center justify-center px-4">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          {/* تشغيل التسجيل الحقيقي للمراجعة. */}

          {audioUrl && !isRecording && (
            <audio controls src={audioUrl} className="w-full max-w-md" />
          )}

          <div className="flex w-full max-w-md gap-3">
            <button
              type="button"
              onClick={resetRecording}
              disabled={isRecording}
              className="
                flex-1
                rounded-xl
                border
                border-slate-200
                py-3
                text-sm
                font-medium
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RotateCcw className="inline h-4 w-4 me-2" />

              {t("createSession.audio.recordAgain")}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!formik.values.diagnosisAudio || isRecording}
              className="
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#0b7a9e]
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#0B4658]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {t("createSession.audio.next")}

              {isRTL ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            disabled={isRecording}
            className="
              flex
              items-center
              gap-1
              text-sm
              text-slate-500
              transition
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isRTL ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}

            {t("createSession.audio.back")}
          </button>
        </div>
      ) : (
        /*  Upload */

        <div className="w-full space-y-4">
          <FileUploader
            onFileSelect={handleUploadedFile}
            onClear={handleClearUploadedFile}
          />

          {audioUrl && <audio controls src={audioUrl} className="w-full" />}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleNext}
              disabled={!formik.values.diagnosisAudio}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#0b7a9e]
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#0B4658]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {t("createSession.audio.next")}

              {isRTL ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="
                flex
                items-center
                justify-center
                gap-1
                text-sm
                text-slate-500
                transition
                hover:text-slate-700
              "
            >
              {isRTL ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}

              {t("createSession.audio.back")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepDiagnosis;
