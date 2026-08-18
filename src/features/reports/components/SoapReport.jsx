import { useTranslation } from "react-i18next";
import {
  MessageSquareText,
  Activity,
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  ShieldAlert,
  Tags,
} from "lucide-react";
const SOAP_SECTIONS = [
  {
    key: "subjective",
    letter: "S",
    icon: MessageSquareText,
  },

  {
    key: "objective",
    letter: "O",
    icon: Activity,
  },

  {
    key: "assessment",
    letter: "A",
    icon: Stethoscope,
  },

  {
    key: "plan",
    letter: "P",
    icon: ClipboardList,
  },
];

const SoapReport = ({ report }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const getSectionItems = (sectionKey) => {
    const section = report?.soap?.[sectionKey];

    if (Array.isArray(section?.items)) {
      return section.items;
    }

    return [];
  };

  const getSectionTitle = (sectionKey) => {
    const section = report?.soap?.[sectionKey];
    if (isRTL && section?.title_ar) {
      return section.title_ar;
    }
    return t(`reports.soap.${sectionKey}.title`);
  };

  const getItemText = (item) => {
    return item?.text_rephrased || item?.text || "-";
  };

  const getItemLabel = (item) => {
    if (isRTL && item?.label_ar) {
      return item.label_ar;
    }

    return item?.label || "-";
  };

  const formatConfidence = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return null;
    }

    if (number >= 0 && number <= 1) {
      return `${(number * 100).toFixed(1)}%`;
    }

    return `${number.toFixed(1)}%`;
  };

  const getEntityName = (entity) => {
    return entity?.matched_text || entity?.code || "-";
  };

  const getEntityValue = (entity) => {
    if (entity?.value !== undefined && entity?.value !== null) {
      return [entity.value, entity.unit].filter(Boolean).join(" ");
    }

    if (entity?.assertion === "absent") {
      return t("reports.entities.absent");
    }

    if (entity?.assertion === "present") {
      return t("reports.entities.present");
    }

    return null;
  };

  const getEntityStatus = (status) => {
    if (!status) {
      return null;
    }

    switch (status) {
      case "high":
        return t("reports.entities.high");

      case "low":
        return t("reports.entities.low");

      case "normal":
        return t("reports.entities.normal");

      default:
        return status;
    }
  };

  const getEntityKind = (kind) => {
    if (!kind) {
      return "";
    }
    return t(`reports.entities.kinds.${kind}`, kind);
  };

  return (
    <div className="space-y-6">
      {SOAP_SECTIONS.map(({ key, letter, icon: Icon }) => {
        const items = getSectionItems(key);

        return (
          <section
            key={key}
            className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-100
                bg-white
                shadow-sm
              "
          >
            {/*  Section Header */}

            <div
              className="
                  flex
                  items-center
                  gap-3
                  border-b
                  border-slate-100
                  bg-slate-50/60
                  px-5
                  py-4
                "
            >
              <div
                className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-primary
                    font-bold
                    text-white
                  "
              >
                {letter}
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-slate-800">
                  {getSectionTitle(key)}
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  {t(`reports.soap.${key}.description`)}
                </p>
              </div>

              <Icon className="ms-auto h-5 w-5 shrink-0 text-slate-300" />
            </div>

            {/*  Items */}

            <div className="p-5">
              {items.length === 0 ? (
                <div
                  className="
                      rounded-xl
                      border
                      border-dashed
                      border-slate-200
                      bg-slate-50/50
                      px-4
                      py-8
                      text-center
                    "
                >
                  <p className="text-sm text-slate-400">
                    {t("reports.soap.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const confidence = formatConfidence(
                      item?.combined_confidence ?? item?.confidence,
                    );

                    const entities = Array.isArray(item?.entity_links)
                      ? item.entity_links
                      : [];

                    return (
                      <article
                        key={item?.item_id || `${key}-${index}`}
                        className={`
                              overflow-hidden
                              rounded-xl
                              border

                              ${
                                item?.is_urgent
                                  ? "border-red-200 bg-red-50/30"
                                  : item?.is_low_confidence
                                    ? "border-amber-200 bg-amber-50/30"
                                    : "border-slate-100 bg-slate-50/40"
                              }
                            `}
                      >
                        {/*  Main Item  */}

                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <span
                              className="
                                    mt-0.5
                                    flex
                                    h-7
                                    w-7
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-white
                                    text-xs
                                    font-semibold
                                    text-slate-400
                                    shadow-sm
                                  "
                            >
                              {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm leading-7 text-slate-700">
                                  {getItemText(item)}
                                </p>

                                {item?.is_urgent && (
                                  <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-red-500" />
                                )}
                              </div>

                              {/*  Metadata  */}

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span
                                  className="
                                        rounded-full
                                        border
                                        border-slate-100
                                        bg-white
                                        px-2.5
                                        py-1
                                        text-xs
                                        font-medium
                                        text-slate-500
                                      "
                                >
                                  {getItemLabel(item)}
                                </span>

                                {confidence && (
                                  <span
                                    className="
                                          rounded-full
                                          border
                                          border-slate-100
                                          bg-white
                                          px-2.5
                                          py-1
                                          text-xs
                                          text-slate-500
                                        "
                                  >
                                    {t("reports.confidence")}

                                    {": "}

                                    {confidence}
                                  </span>
                                )}

                                {item?.is_low_confidence && (
                                  <span
                                    className="
                                          flex
                                          items-center
                                          gap-1
                                          rounded-full
                                          border
                                          border-amber-200
                                          bg-amber-50
                                          px-2.5
                                          py-1
                                          text-xs
                                          font-medium
                                          text-amber-600
                                        "
                                  >
                                    <AlertTriangle className="h-3 w-3" />

                                    {t("reports.needsReview")}
                                  </span>
                                )}

                                {item?.is_urgent && (
                                  <span
                                    className="
                                          flex
                                          items-center
                                          gap-1
                                          rounded-full
                                          border
                                          border-red-200
                                          bg-red-50
                                          px-2.5
                                          py-1
                                          text-xs
                                          font-medium
                                          text-red-600
                                        "
                                  >
                                    <ShieldAlert className="h-3 w-3" />

                                    {t("reports.urgent")}
                                  </span>
                                )}

                                <span
                                  className="
                                        rounded-full
                                        border
                                        border-slate-100
                                        bg-white
                                        px-2.5
                                        py-1
                                        text-xs
                                        text-slate-400
                                      "
                                  dir="ltr"
                                >
                                  {Number(item?.start_sec || 0).toFixed(1)}

                                  {"s – "}

                                  {Number(item?.end_sec || 0).toFixed(1)}

                                  {"s"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Extracted Entities  */}

                        {entities.length > 0 && (
                          <div
                            className="
                                  border-t
                                  border-slate-100
                                  bg-white/70
                                  px-4
                                  py-4
                                "
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <Tags className="h-4 w-4 text-primary" />

                              <p className="text-xs font-semibold text-slate-600">
                                {t("reports.entities.title")}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {entities.map((entity, entityIndex) => {
                                const value = getEntityValue(entity);

                                const status = getEntityStatus(entity?.status);

                                return (
                                  <div
                                    key={`${item.item_id}-entity-${entityIndex}`}
                                    className="
                                            rounded-lg
                                            border
                                            border-slate-100
                                            bg-slate-50/70
                                            px-3
                                            py-2.5
                                          "
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-700">
                                          {getEntityName(entity)}
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                          {getEntityKind(entity?.kind)}
                                        </p>
                                      </div>

                                      <div className="shrink-0 text-end">
                                        {value && (
                                          <p
                                            className={`
                                                    text-xs
                                                    font-semibold

                                                    ${
                                                      entity?.assertion ===
                                                      "absent"
                                                        ? "text-emerald-600"
                                                        : "text-slate-700"
                                                    }
                                                  `}
                                          >
                                            {value}
                                          </p>
                                        )}

                                        {status && (
                                          <p
                                            className={`
                                                    mt-0.5
                                                    text-xs
                                                    font-semibold

                                                    ${
                                                      entity?.status === "high"
                                                        ? "text-red-600"
                                                        : entity?.status ===
                                                            "low"
                                                          ? "text-amber-600"
                                                          : "text-emerald-600"
                                                    }
                                                  `}
                                          >
                                            {status}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SoapReport;
