import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginCard from "../../features/auth/Login/LoginCard";
import SignupCard from "../../features/auth/Signin/Signupcard";
import AuthModal, { type AuthMode } from "../auth/AuthModal";
import "./navbar.css";

// NavLink component moved outside Navbar
interface NavLinkProps {
  href?: string;
  sectionId?: string;
  fallbackPath?: string;
  children: React.ReactNode;
  className?: string;
  handleScrollOrNavigate?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    sectionId: string,
    fallbackPath: string
  ) => void;
}

const NavLinkComponent: React.FC<NavLinkProps> = ({
  href,
  sectionId,
  fallbackPath,
  children,
  className,
  handleScrollOrNavigate,
}) => {
  if (href && !sectionId) {
    return (
      <Link to={href} className={className} onClick={() => {}}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={`#${sectionId}`}
      onClick={(e) => handleScrollOrNavigate?.(e, sectionId!, fallbackPath!)}
      className={className}
    >
      {children}
    </a>
  );
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const closeAuth = () => setAuthOpen(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  const handleScrollOrNavigate = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    sectionId: string,
    fallbackPath: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate(fallbackPath);
  };

  return (
    <>
      <header className="hp-glassNav fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span>Care Home</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium">
            <NavLinkComponent
              href="/"
              className="hp-navLink link-underline hp-navLink--active"
            >
              Home
            </NavLinkComponent>
            <NavLinkComponent
              sectionId="about"
              fallbackPath="/about"
              className="hp-navLink link-underline"
              handleScrollOrNavigate={handleScrollOrNavigate}
            >
              About Us
            </NavLinkComponent>
            <NavLinkComponent
              sectionId="services"
              fallbackPath="/services"
              className="hp-navLink link-underline"
              handleScrollOrNavigate={handleScrollOrNavigate}
            >
              Services
            </NavLinkComponent>
            <NavLinkComponent href="/payments" className="hp-navLink link-underline">
              Cost &amp; Payments
            </NavLinkComponent>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/contact"
              className="btn-modern hidden lg:inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white transition"
            >
              Contact
            </Link>

            <button
              onClick={openLogin}
              className="btn-modern inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 lg:px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Login
            </button>

            <button
              onClick={openSignup}
              className="btn-modern inline-flex justify-center rounded-lg border border-emerald-600 px-3 lg:px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"
            >
              Sign Up
            </button>
          </div>

          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg">
            <nav className="px-4 py-4 space-y-3">
              <NavLinkComponent
                href="/"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 bg-emerald-50"
              >
                Home
              </NavLinkComponent>
              <NavLinkComponent
                sectionId="about"
                fallbackPath="/about"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                handleScrollOrNavigate={handleScrollOrNavigate}
              >
                About Us
              </NavLinkComponent>
              <NavLinkComponent
                sectionId="services"
                fallbackPath="/services"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                handleScrollOrNavigate={handleScrollOrNavigate}
              >
                Services
              </NavLinkComponent>
              <NavLinkComponent
                href="/payments"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cost &amp; Payments
              </NavLinkComponent>
              <NavLinkComponent
                href="/contact"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Contact
              </NavLinkComponent>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button
                  onClick={openLogin}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Login
                </button>
                <button
                  onClick={openSignup}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                >
                  Sign Up
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={closeAuth} mode={authMode} onSwitchMode={setAuthMode}>
        {authMode === "login" ? (
          <LoginCard onGoSignup={() => setAuthMode("signup")} onSuccessClose={closeAuth} />
        ) : (
          <SignupCard onGoLogin={() => setAuthMode("login")} onSuccessClose={closeAuth} />
        )}
      </AuthModal>
    </>
  );
};

export default Navbar;