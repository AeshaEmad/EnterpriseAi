function Header({
  user,
  onLogout,
  onBack,
  eyebrow = "AUTO-FILLER",
  title = "Live Demo",
}) {
  return (
    <header className="demo-header">
      <div className="header-left">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <div className="header-title">
          <div className="breadcrumb">{eyebrow}</div>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-right">
        {user && (
          <div className="header-user">
            <span className="user-avatar">
              {user.fullName.charAt(0).toUpperCase()}
            </span>

            <span className="user-name">{user.fullName}</span>

            <button
              className="logout-button"
              type="button"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
