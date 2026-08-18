import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Search, Check, Mic, Loader2, AlertCircle } from "lucide-react";
import { getPatients } from "../../patients/services/patientApi";
import { getApiErrorMessage } from "../../auth/services/authApi";

const StepInfo = ({ formik, onNext }) => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState(
    formik.values.patientName || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isPatientsOpen, setIsPatientsOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(patientSearch.trim());
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [patientSearch]);

  /*
   * Load Patients
   */

  useEffect(() => {
    let ignore = false;

    const loadPatients = async () => {
      setIsLoadingPatients(true);
      setPatientsError("");

      try {
        const response = await getPatients({
          q: debouncedSearch,
          page: 1,
          perPage: 20,
        });

        if (ignore) {
          return;
        }

        const paginator = response?.data;

        const rows = Array.isArray(paginator)
          ? paginator
          : paginator?.data || [];

        setPatients(rows);
      } catch (error) {
        if (ignore) {
          return;
        }

        console.error(
          "LOAD PATIENTS FOR SESSION ERROR:",
          error.response?.data || error.message,
        );

        setPatients([]);

        setPatientsError(
          getApiErrorMessage(
            error,
            t("createSession.patient.errors.loadFailed"),
          ),
        );
      } finally {
        if (!ignore) {
          setIsLoadingPatients(false);
        }
      }
    };

    loadPatients();

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, t]);

  /*
   * Select Patient
   */

  const handleSelectPatient = async (patient) => {
    const fullName = [patient.first_name, patient.last_name]
      .filter(Boolean)
      .join(" ");

    await formik.setFieldValue("patientId", Number(patient.id), false);
    await formik.setFieldValue("patientName", fullName, false);

    formik.setFieldError("patientId", undefined);
    formik.setFieldTouched("patientId", false, false);
    setPatientSearch(fullName);
    setIsPatientsOpen(false);
  };

  /*
   * Search Input Change
   */

  const handlePatientSearchChange = (event) => {
    const value = event.target.value;
    setPatientSearch(value);
    formik.setFieldValue("patientName", value, false);

    formik.setFieldValue("patientId", "", false);
    formik.setFieldError("patientId", undefined);
    formik.setFieldTouched("patientId", false, false);
    setIsPatientsOpen(true);
  };

  /*
   * Go Next
   */

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="space-y-5 bg-blue-50">
      {/* ─── قسم المريض ─── */}

      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-slate-400" />

          <h3 className="font-semibold text-slate-800">
            {t("createSession.patient.title")}
          </h3>
        </div>

        <div className="relative">
          <div className="relative">
            <Search
              className="
                absolute
                start-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={patientSearch}
              onChange={handlePatientSearchChange}
              onFocus={() => setIsPatientsOpen(true)}
              placeholder={t("createSession.patient.searchPlaceholder")}
              autoComplete="off"
              className={`
                w-full
                rounded-xl
                border
                bg-white
                py-3
                ps-10
                pe-10
                text-sm
                text-slate-800
                outline-none
                transition
                focus:ring-2
                focus:ring-primary/20

                ${
                  formik.touched.patientId && formik.errors.patientId
                    ? "border-red-500"
                    : "border-slate-200 focus:border-primary"
                }
              `}
            />

            {isLoadingPatients && (
              <Loader2
                className="
                  absolute
                  end-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  animate-spin
                  text-primary
                "
              />
            )}
          </div>

          {/* Validation  */}

          {formik.touched.patientId && formik.errors.patientId && (
            <p className="mt-1.5 text-xs text-red-500">
              {formik.errors.patientId}
            </p>
          )}

          {/* Patients Dropdown */}

          {isPatientsOpen && (
            <div
              className="
                absolute
                start-0
                end-0
                z-30
                mt-2
                max-h-72
                overflow-y-auto
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-xl
              "
            >
              {isLoadingPatients ? (
                <div className="flex items-center justify-center gap-2 p-5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />

                  <p className="text-xs text-slate-500">
                    {t("createSession.patient.loading")}
                  </p>
                </div>
              ) : patientsError ? (
                <div className="flex items-start gap-2 p-4 text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p className="text-xs">{patientsError}</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    {t("createSession.patient.empty")}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {t("createSession.patient.emptyHint")}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {patients.map((patient) => {
                    const fullName = [patient.first_name, patient.last_name]
                      .filter(Boolean)
                      .join(" ");

                    const isSelected =
                      Number(formik.values.patientId) === Number(patient.id);

                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className={`
                            flex
                            w-full
                            items-center
                            justify-between
                            gap-4
                            px-4
                            py-3
                            text-start
                            transition

                            ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}
                          `}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {fullName || "-"}
                          </p>

                          <p
                            className="
                                mt-1
                                truncate
                                text-xs
                                text-slate-400
                              "
                            dir="ltr"
                          >
                            {patient.mrn ? patient.mrn : `#${patient.id}`}
                          </p>
                        </div>

                        {isSelected && (
                          <div
                            className="
                                flex
                                h-6
                                w-6
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-primary
                                text-white
                              "
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {formik.values.patientId && (
          <div
            className="
              mt-3
              flex
              items-center
              gap-2
              rounded-lg
              border
              border-emerald-100
              bg-emerald-50
              px-3
              py-2
            "
          >
            <Check className="h-4 w-4 text-emerald-600" />

            <p className="text-xs text-emerald-700">
              {t("createSession.patient.selected")}{" "}
              <span className="font-semibold">{formik.values.patientName}</span>
            </p>
          </div>
        )}
      </div>

      {/* ─── زر التسجيل الصوتي ─── */}

      <button
        type="button"
        onClick={handleNext}
        className="
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-primary
          py-3.5
          text-sm
          font-semibold
          text-white
          transition
          hover:cursor-pointer
          hover:opacity-90
        "
      >
        <Mic className="h-4 w-4" />

        {t("createSession.patient.startRecording")}
      </button>
    </div>
  );
};

export default StepInfo;
