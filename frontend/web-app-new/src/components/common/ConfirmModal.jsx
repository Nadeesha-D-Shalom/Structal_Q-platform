const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">

      <div className="bg-white w-[420px] rounded-xl p-6 shadow-lg relative">

        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400"
        >
          ✖
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 text-red-500 flex items-center justify-center rounded-full">
            !
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-gray-600"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-500 text-white rounded-lg"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;