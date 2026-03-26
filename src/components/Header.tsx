import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Plus,
  Menu,
  X,
  LogIn,
  LogOut,
  ListVideo,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { AuthModal } from "./AuthModal";
import shareflixLogo from "../assets/shareflixlogo.png";

function ShareflixLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={shareflixLogo}
      alt="Shareflix"
      className={className}
      style={{
        height: "1em",
        width: "auto",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    />
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, signOut } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/my-playlists", label: "My Playlists" },
  ];

  const menuItems = [
    { icon: ListVideo, label: "My Playlists", to: "/my-playlists" },
    { icon: Plus, label: "Create Playlist", to: "/create" },
  ];

  const handleSearchSubmit = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-netflix-bg/95 backdrop-blur-sm shadow-[0_1px_0_rgba(255,255,255,0.05)]"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between h-[41px] md:h-[68px] px-6 md:px-14 lg:px-[60px]">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-5 md:gap-6">
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <Link to="/" className="shrink-0">
              <ShareflixLogo className="text-[1.4rem] md:text-[1.7rem]" />
            </Link>

            <nav className="hidden md:flex items-center gap-4 lg:gap-5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-[13px] lg:text-sm transition-colors whitespace-nowrap ${
                    location.pathname === item.path && item.label === "Home"
                      ? "text-white font-semibold"
                      : "text-[#e5e5e5] hover:text-netflix-gray-light"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Search + Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search */}
            <div className="relative flex items-center">
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="open"
                    initial={{ width: 36, opacity: 0.5 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 36, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="flex items-center rounded-full overflow-hidden"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocusCapture={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        "rgba(229,9,20,0.55)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        "0 0 0 3px rgba(229,9,20,0.12)";
                    }}
                    onBlurCapture={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "rgba(255,255,255,0.2)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "none";
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                  >
                    <Search className="w-4 h-4 ml-3.5 text-white/50 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchSubmit();
                        }
                      }}
                      placeholder="Titles, people, genres"
                      autoFocus
                      className="bg-transparent text-white text-sm px-2.5 py-1.75 w-full outline-none placeholder-white/35"
                    />
                  </motion.div>
                ) : (
                  <motion.button
                    key="closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSearchOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Search className="w-5 h-5 text-white/80" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Profile / Sign In */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 outline-none"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, #E50914 0%, #8B0000 100%)",
                      boxShadow: dropdownOpen
                        ? "0 0 0 2px rgba(229,9,20,0.65), 0 0 14px rgba(229,9,20,0.3)"
                        : "0 0 0 2px rgba(229,9,20,0.25)",
                    }}
                  >
                    {user.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <motion.div
                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-white/55" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      className="absolute right-0 top-full mt-3 min-w-55 rounded-xl overflow-hidden"
                      style={{
                        background: "rgba(8,8,8,0.97)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow:
                          "0 24px 64px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* Caret */}
                      <div
                        className="absolute -top-1.25 right-5 w-2.5 h-2.5 rotate-45"
                        style={{
                          background: "rgba(8,8,8,0.97)",
                          borderLeft: "1px solid rgba(255,255,255,0.08)",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />

                      {/* User info */}
                      <div
                        className="px-4 pt-4 pb-3.5"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #E50914 0%, #8B0000 100%)",
                              boxShadow: "0 0 0 2px rgba(229,9,20,0.3)",
                            }}
                          >
                            {user.displayName?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white leading-tight">
                              {user.displayName || "User"}
                            </p>
                            <p className="text-[11px] text-white/35 truncate mt-0.5 font-mono tracking-tight">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        {menuItems.map(({ icon: Icon, label, to }, i) => (
                          <motion.div
                            key={label}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 + i * 0.03 }}
                          >
                            <Link
                              to={to}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/4 transition-colors group"
                            >
                              <Icon className="w-4 h-4 text-white/25 group-hover:text-netflix-red transition-colors shrink-0" />
                              {label}
                            </Link>
                          </motion.div>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                        className="py-1.5"
                      >
                        <button
                          onClick={() => {
                            signOut();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/4 transition-colors group"
                        >
                          <LogOut className="w-4 h-4 text-white/25 group-hover:text-netflix-red transition-colors" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 bg-netflix-red hover:bg-[#f40612] rounded transition-colors text-sm font-medium"
                style={{ padding: "8px 18px" }}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 h-full bg-netflix-bg-light pt-20 px-6">
              <nav className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg ${
                      location.pathname === item.path
                        ? "text-white font-medium"
                        : "text-netflix-gray-light"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-netflix-red text-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  New Playlist
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
