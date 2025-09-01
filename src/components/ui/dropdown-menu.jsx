import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const Ctx = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen, triggerRef, menuRef }}>
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }) {
  const { open, setOpen, triggerRef } = useContext(Ctx);
  const onClick = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick,
      "aria-expanded": open,
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={onClick}
      className="p-2 rounded hover:bg-gray-100"
      aria-expanded={open}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = "start", className = "", children }) {
  const { open, menuRef } = useContext(Ctx);
  if (!open) return null;
  const alignClass = align === "end" ? "right-0" : "left-0";
  return (
    <div
      ref={menuRef}
      className={`absolute z-50 mt-2 w-44 rounded-md border bg-white shadow-lg ${alignClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ onSelect, className = "", children }) {
  const { setOpen } = useContext(Ctx);
  function handleClick(e) {
    onSelect?.(e);
    setOpen(false);
  }
  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

export default {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
