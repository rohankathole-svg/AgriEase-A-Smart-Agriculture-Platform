import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  style = {},
  className = "",
}) {
  const classes = ["btn", className, loading ? "is-loading" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={classes}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
