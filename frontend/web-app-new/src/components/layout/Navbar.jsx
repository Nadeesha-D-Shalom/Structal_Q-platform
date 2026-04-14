const Navbar = () => {
  return (
    <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold text-blue-900">
        Structal<span className="text-orange-500">Q</span>
      </h1>

      <div className="flex gap-6 text-sm text-gray-600">
        <span className="cursor-pointer hover:text-black">Dashboard</span>
        <span className="cursor-pointer hover:text-black">Subjects</span>
        <span className="cursor-pointer hover:text-black">Marks</span>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm">Dr. Robert Fox</p>
        <div className="w-9 h-9 bg-orange-300 rounded-full"></div>
      </div>
    </div>
  );
};

export default Navbar;