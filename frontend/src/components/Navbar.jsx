import { FaBook } from "react-icons/fa";

function Navbar() {
  return (
    <nav className="navbar navbar-dark navbar-custom px-4">
      <span className="navbar-brand d-flex align-items-center gap-2 fw-bold">
        <FaBook size={22} />
        📚 Study Center Management System
      </span>
      <span className="text-light small">👤 Admin</span>
    </nav>
  );
}

export default Navbar;
