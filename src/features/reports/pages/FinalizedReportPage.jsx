import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Loader2,
  Printer,
  RefreshCw,
  UserRound,
} from "lucide-react";

import FinalReportDocument from "../components/FinalReportDocument";
import FullSessionAudio from "../components/FullSessionAudio";
import { getFinalizedReport } from "../services/reportApi";
import { getClinicalSession } from "../../create_session/services/sessionApi";
import { getPatient } from "../../patients/services/patientApi";
import { getApiErrorMessage } from "../../auth/services/authApi";

const extractFinalizedReport = (response) => {
  return (
    response?.data?.finalized_report ||
    response?.data?.data?.finalized_report ||
    null
  );
};

const extractSession = (response) => {
  return response?.data?.session || response?.data?.data?.session || null;
};

const extractPatient = (response) => {
  return response?.data?.patient || response?.data?.data?.patient || null;
};
const FinalizedReportPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");

  const tr = (key, ar, en) =>
    t(key, {
      defaultValue: isRTL ? ar : en,
    });

  const [finalizedReport, setFinalizedReport] = useState(null);
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFinalized, setNotFinalized] = useState(false);

  /*
   * Load Final Report
   */
  const loadFinalReport = useCallback(async () => {
    if (!reportId) {
      setError(
        tr(
          "reports.finalDocument.errors.invalidSession",
          "رقم المعاينة غير صالح.",
          "Invalid clinical session.",
        ),
      );

      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setNotFinalized(false);

    try {
      const [finalizedResult, sessionResult] = await Promise.allSettled([
        getFinalizedReport(reportId),
        getClinicalSession(reportId),
      ]);

      if (finalizedResult.status === "rejected") {
        if (finalizedResult.reason?.response?.status === 404) {
          setNotFinalized(true);
          return;
        }

        throw finalizedResult.reason;
      }

      const final = extractFinalizedReport(finalizedResult.value);

      if (!final) {
        throw new Error("Invalid finalized report response.");
      }

      setFinalizedReport(final);

      let loadedSession = null;

      if (sessionResult.status === "fulfilled") {
        loadedSession = extractSession(sessionResult.value);
        setSession(loadedSession);
      }

      const patientId = loadedSession?.patient_id || final?.patient_id || null;

      if (patientId) {
        try {
          const patientResponse = await getPatient(patientId);
          const patientRecord = extractPatient(patientResponse);

          setPatient(patientRecord || loadedSession?.patient || null);
        } catch (patientError) {
          console.error(
            "LOAD FINAL REPORT PATIENT ERROR:",
            patientError.response?.data || patientError.message,
          );

          setPatient(loadedSession?.patient || null);
        }
      } else {
        setPatient(loadedSession?.patient || null);
      }
    } catch (err) {
      console.error(
        "LOAD FINALIZED REPORT PAGE ERROR:",
        err.response?.data || err.message,
      );

      setError(
        getApiErrorMessage(
          err,
          tr(
            "reports.finalDocument.errors.loadFailed",
            "تعذر تحميل التقرير الطبي النهائي.",
            "Could not load the final clinical report.",
          ),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [reportId, t, isRTL]);

  useEffect(() => {
    loadFinalReport();
  }, [loadFinalReport]);

  /*
   * PDF / Print
   */

  const handleExportPdf = () => {
    const reportElement = document.querySelector(".final-report-document");

    if (!reportElement) {
      return;
    }

    const printFrame = document.createElement("iframe");

    printFrame.setAttribute("title", "final-report-print-frame");
    printFrame.style.position = "fixed";
    printFrame.style.left = "-10000px";
    printFrame.style.top = "0";
    printFrame.style.width = "1200px";
    printFrame.style.height = "900px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";

    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument;

    if (!printDocument) {
      printFrame.remove();
      return;
    }

    const inheritedStyles = Array.from(
      document.head.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((node) => node.outerHTML)
      .join("\n");

    printDocument.open();
    printDocument.write(`
      <!doctype html>
      <html lang="${isRTL ? "ar" : "en"}" dir="${isRTL ? "rtl" : "ltr"}">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <base href="${window.location.origin}/" />
          <title>${tr(
            "reports.finalDocument.title",
            "التقرير الطبي النهائي",
            "Final Clinical Report",
          )}</title>

          ${inheritedStyles}

          <style>
            @page {
              size: A4;
              margin: 12mm;
            }

            html,
            body {
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }

            .final-report-document {
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              max-height: none !important;
              margin: 0 !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }

            .final-report-document article,
            .final-report-document section,
            .final-report-document footer,
            .final-report-document div {
              max-height: none !important;
              overflow: visible !important;
            }

            .avoid-print-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>

        <body>
          ${reportElement.outerHTML}
        </body>
      </html>
    `);
    printDocument.close();

    const printReport = async () => {
      try {
        if (printDocument.fonts?.ready) {
          await printDocument.fonts.ready;
        }
      } catch (fontError) {
        console.warn("PRINT FONT LOAD WARNING:", fontError);
      }

      const printWindow = printFrame.contentWindow;
      if (!printWindow) {
        printFrame.remove();
        return;
      }

      const cleanup = () => {
        window.setTimeout(() => {
          printFrame.remove();
        }, 300);
      };

      printWindow.addEventListener("afterprint", cleanup, {
        once: true,
      });

      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);

      window.setTimeout(() => {
        if (document.body.contains(printFrame)) {
          printFrame.remove();
        }
      }, 60000);
    };

    if (printDocument.readyState === "complete") {
      printReport();
    } else {
      printFrame.onload = printReport;
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  /*
   * Loading
   */

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <p className="text-sm">
            {tr(
              "reports.finalDocument.loading",
              "جارٍ تحميل التقرير النهائي...",
              "Loading final report...",
            )}
          </p>
        </div>
      </div>
    );
  }

  /*
   * Not Finalized Yet
   */

  if (notFinalized) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm">
          <FileCheck2 className="mx-auto h-10 w-10 text-amber-500" />

          <h1 className="mt-4 text-lg font-bold text-slate-800">
            {tr(
              "reports.finalDocument.notFinalizedTitle",
              "التقرير لم يُعتمد بعد",
              "Report not finalized yet",
            )}
          </h1>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            {tr(
              "reports.finalDocument.notFinalizedDescription",
              "ارجع إلى صفحة المراجعة واعتمد التقرير أولاً لإنشاء النسخة الطبية النهائية.",
              "Return to the review page and finalize the report first.",
            )}
          </p>

          <button
            type="button"
            onClick={() => navigate(`/dashboard/reports/${reportId}`)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            <BackIcon className="h-4 w-4" />

            {tr(
              "reports.finalDocument.backToReview",
              "العودة إلى التقرير",
              "Back to report",
            )}
          </button>
        </div>
      </div>
    );
  }

  /*
   * Error
   */

  if (error || !finalizedReport) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-lg font-bold text-slate-800">
            {tr(
              "reports.finalDocument.errors.title",
              "تعذر عرض التقرير النهائي",
              "Unable to display final report",
            )}
          </h1>

          <p className="mt-2 text-sm leading-7 text-red-600">
            {error ||
              tr(
                "reports.finalDocument.errors.loadFailed",
                "تعذر تحميل التقرير الطبي النهائي.",
                "Could not load the final clinical report.",
              )}
          </p>

          <button
            type="button"
            onClick={loadFinalReport}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />

            {tr("reports.finalDocument.retry", "إعادة المحاولة", "Try again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="final-report-page-shell min-h-screen bg-slate-100/70 px-3 py-5 sm:px-5 lg:px-7 lg:py-7">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: #ffffff !important;
          }

          .no-print,
          .final-report-actions {
            display: none !important;
          }

          .final-report-page-shell {
            min-height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
          }

          .final-report-document {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;

  /* تمت الإضافة:
     السماح للمحتوى بالاستمرار عبر صفحات PDF بدون قص. */
  overflow: visible !important;
}

.final-report-document article,
.final-report-document section,
.final-report-document footer {
  overflow: visible !important;
}
          .avoid-print-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="final-report-actions mx-auto mb-5 flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/reports/${reportId}`)}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <BackIcon className="h-4 w-4" />

          {tr("reports.finalDocument.back", "العودة", "Back")}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {patient?.id && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-primary/20 hover:text-primary"
            >
              <UserRound className="h-4 w-4" />

              {tr(
                "reports.finalDocument.patientFile",
                "ملف المريضة",
                "Patient record",
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Printer className="h-4 w-4" />

            {tr("reports.finalDocument.exportPdf", "تصدير PDF", "Export PDF")}
          </button>
        </div>
      </div>

      <div className="no-print mx-auto mb-5 w-full max-w-5xl">
        <FullSessionAudio sessionId={reportId} />
      </div>

      <FinalReportDocument
        finalizedReport={finalizedReport}
        session={session}
        patient={patient}
      />
    </div>
  );
};

export default FinalizedReportPage;
