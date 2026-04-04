"use client";

import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
});

export function SwaggerClient() {
  return (
    <SwaggerUI
      defaultModelsExpandDepth={-1}
      displayRequestDuration
      docExpansion="list"
      filter
      persistAuthorization
      url="/api/openapi.json"
    />
  );
}
