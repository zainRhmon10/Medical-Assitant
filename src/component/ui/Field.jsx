import React from "react";

const FormField = (props) => {
  const error =
    props.formik.touched[props.name] && props.formik.errors[props.name];
  const hasError = Boolean(error);

  const baseClasses =
    "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20";
  const borderClasses = hasError
    ? "border-red-400"
    : "border-slate-200 focus:border-teal-500";

  const isLtrInRtl = props.isRtl && props.dir === "ltr";

  return (
    <div className="space-y-1.5">
      {props.label && (
        <label className="block text-sm font-medium text-slate-700">
          {props.label}
        </label>
      )}

      <div className="relative">
        {props.startElement && (
          <div className="absolute start-3 top-1/2 -translate-y-1/2 z-10">
            {props.startElement}
          </div>
        )}

        {props.secondaryIcon &&
          React.createElement(props.secondaryIcon, {
            className:
              "absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none",
          })}

        <input
          type={props.type || "text"}
          name={props.name}
          dir={props.dir || "auto"}
          placeholder={props.placeholder || ""}
          value={props.formik.values[props.name]}
          onChange={props.formik.handleChange}
          onBlur={props.formik.handleBlur}
          style={{ textAlign: isLtrInRtl ? "right" : undefined }}
          className={`${baseClasses} ${borderClasses} ${props.extraClasses || ""}`}
        />

        {props.icon &&
          React.createElement(props.icon, {
            className:
              "absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none",
          })}
      </div>

      {hasError && <p className="text-xs text-red-500">{error}</p>}
      {props.children}
    </div>
  );
};

export default React.memo(FormField);
