import { useEffect } from "react";
import { createPortal } from "react-dom";

const ModalPortal = ({
  children,
  onCerrar,
  cerrarAlPresionarFondo = true,
}) => {
  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        onCerrar?.();
      }
    };

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        cerrarConEscape,
      );
    };
  }, [onCerrar]);

  const manejarFondo = (event) => {
    if (!cerrarAlPresionarFondo) return;

    if (event.target === event.currentTarget) {
      onCerrar?.();
    }
  };

  return createPortal(
    <div
      className="
        fixed inset-0
        flex items-center justify-center
        overflow-y-auto
        bg-black/85
        p-4
        backdrop-blur-md
      "
      style={{
        zIndex: 2147483647,
        isolation: "isolate",
      }}
      onMouseDown={manejarFondo}
    >
      <div
        className="
          relative
          flex w-full
          justify-center
        "
        style={{
          zIndex: 1,
        }}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default ModalPortal;