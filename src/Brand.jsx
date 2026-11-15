import React from "react";

export default function Brand() {
  return (
    <>
      <span className="brand-icon">
        <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
          <path d="M3 28V9l11-5v24M3 9l11 5" />
          <path d="M6 17v2m4-4v2m-4 5v2m4-4v2" />
          <path d="m15 28 5-14h5l5 14M17 22h11" />
          <path className="brand-road-mark" d="m22.5 17-.5 2m-1 4-.5 2" />
        </svg>
      </span>
      <span className="brand-name">Ethio-Con Tech</span>
    </>
  );
}
