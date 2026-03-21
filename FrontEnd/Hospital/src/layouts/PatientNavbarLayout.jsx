import { Outlet } from "react-router-dom";
import PatientNavbar from "../components/Navbar/PatientNavbar";

const PatientLayout = () => {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PatientNavbar />

      <main
        className="
          transition-[padding-left] duration-300 ease-in-out
        "
      >
        <div className="max-w-8xl mx-auto px-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PatientLayout;