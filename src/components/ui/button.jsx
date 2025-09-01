import React from "react";

export function Button({ children, variant = "default", size = "md", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition";
  const sizes = { icon: "h-9 w-9", sm: "h-8 px-3", md: "h-10 px-4" };
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    outline: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
  };
  return (
    <button
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
