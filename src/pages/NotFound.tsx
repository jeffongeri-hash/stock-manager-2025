import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Helmet>
        <title>Page not found | Profit Pathfinder</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! We couldn't find that page.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="text-primary underline">Return to Home</Link>
          <Link to="/all-tools" className="text-primary underline">Browse all tools</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
