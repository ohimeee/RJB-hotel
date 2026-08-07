import Sidebar from "@/components/admin/Sidebar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <Sidebar />

      <main className="p-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
