import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Edit2,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { getPatients } from "../../patients/services/patientApi";
import { getApiErrorMessage } from "../../auth/services/authApi";
import PatientFormModal from "../../patients/components/PatientFormModal";
const PatientsTab = () => {
  const { t, i18n } = useTranslation();

  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;
  const isRTL = i18n.language?.startsWith("ar");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());

      setCurrentPage(1);
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [search]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeout = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [successMessage]);

  useEffect(() => {
    let ignore = false;

    const loadPatients = async () => {
      setIsLoading(true);

      setApiError("");

      try {
        const response = await getPatients({
          q: debouncedSearch,
          page: currentPage,
          perPage,
        });

        if (ignore) {
          return;
        }

        const paginator = response?.data;
        const rows = Array.isArray(paginator)
          ? paginator
          : paginator?.data || [];

        setPatients(rows);

        setCurrentPage(
          Array.isArray(paginator) ? 1 : paginator?.current_page || 1,
        );

        setLastPage(Array.isArray(paginator) ? 1 : paginator?.last_page || 1);

        setTotal(
          Array.isArray(paginator) ? paginator.length : paginator?.total || 0,
        );
      } catch (error) {
        if (ignore) {
          return;
        }

        console.error(
          "GET PATIENTS ERROR:",
          error.response?.data || error.message,
        );

        setPatients([]);

        setApiError(
          getApiErrorMessage(error, t("dashboard.patients.loadError")),
        );
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadPatients();

    return () => {
      ignore = true;
    };
  }, [currentPage, debouncedSearch, reloadKey, t]);

  const calculateAge = (birthDate) => {
    if (!birthDate) {
      return "-";
    }
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return "-";
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birth.getDate())
    ) {
      age -= 1;
    }

    return t("dashboard.patients.ageValue", {
      age,
    });
  };

  const handleReload = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    setReloadKey((previous) => previous + 1);
  };

  const handleOpenAddPatient = () => {
    setApiError("");
    setSuccessMessage("");
    setSelectedPatient(null);
    setIsAddPatientOpen(true);
  };

  const handleOpenEditPatient = (patient) => {
    setApiError("");
    setSuccessMessage("");
    setSelectedPatient(patient);
    setIsAddPatientOpen(true);
  };

  const handleClosePatientModal = () => {
    setIsAddPatientOpen(false);

    setSelectedPatient(null);
  };

  const handlePatientCreated = (patient) => {
    const fullName = [patient?.first_name, patient?.last_name]
      .filter(Boolean)
      .join(" ");

    setSuccessMessage(
      t("dashboard.patients.createdSuccess", {
        name: fullName || "",
      }),
    );

    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      setReloadKey((previous) => previous + 1);
    }
  };

  const handlePatientUpdated = (patient) => {
    const fullName = [patient?.first_name, patient?.last_name]
      .filter(Boolean)
      .join(" ");

    setSuccessMessage(
      t("dashboard.patients.updatedSuccess", {
        name: fullName || "",
      }),
    );

    setSelectedPatient(null);

    setReloadKey((previous) => previous + 1);
  };

  const goToPreviousPage = () => {
    if (isLoading || currentPage <= 1) {
      return;
    }

    setCurrentPage((previous) => previous - 1);
  };

  const goToNextPage = () => {
    if (isLoading || currentPage >= lastPage) {
      return;
    }

    setCurrentPage((previous) => previous + 1);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          {/*  Header  */}

          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {t("dashboard.patients.title")}
              </h2>

              {!isLoading && (
                <p className="mt-1 text-xs text-slate-400">
                  {t("dashboard.patients.total", {
                    total,
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/*Search  */}

              <div className="relative">
                <Search
                  className={`
                    absolute
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-slate-400
                    ${isRTL ? "right-3" : "left-3"}
                  `}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("dashboard.patients.search")}
                  className={`
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    text-xs
                    text-slate-700
                    outline-none
                    transition
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                    sm:w-64

                    ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}
                  `}
                />
              </div>

              {/* Refresh  */}

              <button
                type="button"
                onClick={handleReload}
                disabled={isLoading}
                title={t("dashboard.patients.reload")}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-slate-400
                  transition
                  hover:border-primary/20
                  hover:text-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>

              {/* Add Patient  */}

              <button
                type="button"
                onClick={handleOpenAddPatient}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-primary
                  px-4
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                "
              >
                <UserPlus className="h-4 w-4" />

                <span>{t("dashboard.patients.addPatient")}</span>
              </button>
            </div>
          </div>

          {/*  Success  */}

          {successMessage && (
            <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />

              <span>{successMessage}</span>
            </div>
          )}

          {/*  API Error  */}

          {apiError && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-600">{apiError}</p>
            </div>
          )}

          {/* Loading  */}

          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />

                <p className="text-xs">{t("dashboard.patients.loading")}</p>
              </div>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-5">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">
                  {debouncedSearch
                    ? t("dashboard.patients.noSearchResults")
                    : t("dashboard.patients.empty")}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {debouncedSearch
                    ? t("dashboard.patients.tryAnotherSearch")
                    : t("dashboard.patients.emptyHint")}
                </p>

                {!debouncedSearch && (
                  <button
                    type="button"
                    onClick={handleOpenAddPatient}
                    className="
                      mt-5
                      inline-flex
                      items-center
                      gap-2
                      rounded-lg
                      bg-primary
                      px-4
                      py-2.5
                      text-xs
                      font-semibold
                      text-white
                    "
                  >
                    <UserPlus className="h-4 w-4" />

                    {t("dashboard.patients.addPatient")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Patients Table  */

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 text-start">
                      {t("dashboard.patients.id")}
                    </th>

                    <th className="px-5 py-3 text-start">
                      {t("dashboard.patients.name")}
                    </th>

                    <th className="px-5 py-3 text-start">
                      {t("dashboard.patients.age")}
                    </th>

                    <th className="px-5 py-3 text-start">
                      {t("dashboard.patients.phone")}
                    </th>

                    <th className="px-5 py-3 text-start">
                      {t("dashboard.patients.notes")}
                    </th>

                    <th className="px-5 py-3 text-center">
                      {t("dashboard.patients.actions")}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {patients.map((patient) => {
                    const fullName = [patient.first_name, patient.last_name]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr
                        key={patient.id}
                        className="group transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-3.5 font-mono text-slate-500">
                          {patient.mrn || `#${patient.id}`}
                        </td>

                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {fullName || "-"}
                        </td>

                        <td className="px-5 py-3.5 text-slate-600">
                          {calculateAge(patient.birth_date)}
                        </td>

                        <td className="px-5 py-3.5 text-slate-600" dir="ltr">
                          {patient.phone || "-"}
                        </td>

                        <td className="px-5 py-3.5">
                          {patient.notes ? (
                            <span
                              title={patient.notes}
                              className="
                                  block
                                  max-w-[230px]
                                  truncate
                                  rounded
                                  bg-slate-100
                                  px-2
                                  py-0.5
                                  font-medium
                                  text-slate-700
                                "
                            >
                              {patient.notes}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/dashboard/patients/${patient.id}`)
                              }
                              title={t("dashboard.patients.view")}
                              className="
                                  rounded-lg
                                  border
                                  border-slate-100
                                  bg-white
                                  p-1.5
                                  text-slate-400
                                  transition-colors
                                  hover:border-primary/20
                                  hover:text-primary
                                "
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditPatient(patient)}
                              title={t("dashboard.patients.edit")}
                              className="
                                  rounded-lg
                                  border
                                  border-slate-100
                                  bg-white
                                  p-1.5
                                  text-slate-400
                                  transition-colors
                                  hover:border-amber-100
                                  hover:text-amber-500
                                "
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination  */}

          {!isLoading && patients.length > 0 && lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                {t("dashboard.patients.page", {
                  current: currentPage,

                  last: lastPage,
                })}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage <= 1 || isLoading}
                  className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      text-slate-500
                      transition
                      hover:border-primary/20
                      hover:text-primary
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                >
                  <ChevronLeft
                    className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`}
                  />
                </button>

                <span className="min-w-8 text-center text-xs font-semibold text-slate-700">
                  {currentPage}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage >= lastPage || isLoading}
                  className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      text-slate-500
                      transition
                      hover:border-primary/20
                      hover:text-primary
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                >
                  <ChevronRight
                    className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/*  Add / Edit Patient Modal  */}
      <PatientFormModal
        isOpen={isAddPatientOpen}
        patient={selectedPatient}
        onClose={handleClosePatientModal}
        onCreated={handlePatientCreated}
        onUpdated={handlePatientUpdated}
      />
    </>
  );
};

export default PatientsTab;
