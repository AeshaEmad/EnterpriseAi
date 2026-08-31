function Header({ user, onLogout, onBack }) {
  return (
    <header className="demo-header">
      <div className="header-left">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ←
        </button>

        <div className="header-title">
          <div className="breadcrumb">AUTO-FILLER</div>

          <h1>Live Demo</h1>
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
