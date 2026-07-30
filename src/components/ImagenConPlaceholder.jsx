import { useEffect, useState } from "react";

const ICONO_ERROR = "/error.png";

const ImagenConPlaceholder = ({
  src,
  mobileSrc,
  alt = "Imagen no disponible",
  className = "h-full w-full object-cover",
  pictureClassName = "block h-full w-full",
  placeholderClassName = "",
  iconClassName = "h-14 w-14 sm:h-16 sm:w-16",
  loading = "lazy",
  draggable = false,
}) => {
  const [fallo, setFallo] = useState(false);
  const [omitirMobile, setOmitirMobile] = useState(false);

  useEffect(() => {
    setFallo(false);
    setOmitirMobile(false);
  }, [src, mobileSrc]);

  const fuentePrincipal = src || mobileSrc || "";
  const sinFuente = !fuentePrincipal;

  const manejarError = () => {
    if (
      !omitirMobile &&
      mobileSrc &&
      src &&
      String(mobileSrc) !== String(src)
    ) {
      setOmitirMobile(true);
      return;
    }

    setFallo(true);
  };

  if (sinFuente || fallo) {
    return (
      <div
        role="img"
        aria-label={`${alt}. Imagen no disponible`}
        className={`theme-image-placeholder relative flex h-full w-full items-center justify-center overflow-hidden ${placeholderClassName}`}
      >
        <div className="theme-placeholder-gradient absolute inset-0" />
        <div className="theme-placeholder-grid absolute inset-0" />
        <div className="theme-placeholder-overlay absolute inset-0" />

        <img
          src={ICONO_ERROR}
          alt=""
          aria-hidden="true"
          draggable="false"
          className={`theme-placeholder-icon relative z-10 object-contain opacity-80 drop-shadow-[0_10px_30px_rgba(192,122,255,0.25)] ${iconClassName}`}
        />
      </div>
    );
  }

  if (mobileSrc && !omitirMobile) {
    return (
      <picture className={pictureClassName}>
        <source media="(max-width: 767px)" srcSet={mobileSrc} />
        <img
          src={fuentePrincipal}
          alt={alt}
          loading={loading}
          draggable={draggable}
          onError={manejarError}
          className={className}
        />
      </picture>
    );
  }

  return (
    <img
      src={fuentePrincipal}
      alt={alt}
      loading={loading}
      draggable={draggable}
      onError={manejarError}
      className={className}
    />
  );
};

export default ImagenConPlaceholder;