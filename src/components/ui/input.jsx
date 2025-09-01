import React from "react";
export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}
export default Input;
