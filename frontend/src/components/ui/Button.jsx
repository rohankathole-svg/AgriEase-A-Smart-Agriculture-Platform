import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  style = {},
  className = "",
  ...props
}) {
  const classes = [
    "btn", 
    className, 
    loading ? "is-loading" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={classes}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="spinner"></span>
          Please wait...
        </span>
      ) : children}
    </button>
  );
}
