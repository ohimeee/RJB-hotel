import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <main className="p-8">
          {children}
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;