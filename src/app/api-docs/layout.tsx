import "swagger-ui-react/swagger-ui.css";
import "./swagger-overrides.css";

export default function ApiDocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
