import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Redirects any path ending in "/" (except the root) to the same path without it. */
export function TrailingSlashRedirect() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (pathname.length > 1 && pathname.endsWith("/")) {
      navigate(`${pathname.replace(/\/+$/, "") || "/"}${search}${hash}`, { replace: true });
    }
  }, [pathname, search, hash, navigate]);
  return null;
}
