import React, { useState, useEffect } from "react";
import api from "../../utils/axiosConfig";
import { motion } from "framer-motion";
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);

  // Add Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [qualification, setQualification] = useState("");
  const [phone, setPhone] = useState("");

  // Edit States
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editQualification, setEditQualification] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get("/teachers");
      setTeachers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/teachers", {
        name,
        email,
        password,
        qualification,
        phone,
      });

      setLoading(false);
      toast.success("Teacher added successfully");
      resetForm();
      fetchTeachers();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setQualification("");
    setPhone("");
  };

  const startEdit = (teacher) => {
    setEditingId(teacher._id);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditPassword(""); // Don't show current password
    setEditQualification(teacher.qualification || "");
    setEditPhone(teacher.phone || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setEditPassword("");
    setEditQualification("");
    setEditPhone("");
  };

  const updateTeacher = async (id) => {
    setEditLoading(true);

    try {
      const updateData = {
        name: editName,
        email: editEmail,
        qualification: editQualification,
        phone: editPhone,
      };

      // Only include password if it was changed
      if (editPassword) {
        updateData.password = editPassword;
      }

      await api.put(`/teachers/${id}`, updateData);

      setEditLoading(false);
      setEditingId(null);
      toast.success("Teacher updated successfully");
      fetchTeachers();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      setEditLoading(false);
    }
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;

    try {
      await api.delete(`/teachers/${teacherId}`);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Manage <span className="text-blue-600">Teachers</span>
        </h1>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
          Total Teachers:{" "}
          <span className="font-bold text-gray-800">{teachers.length}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Teacher Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-fit lg:col-span-1">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4 border-gray-100">
            <FaPlus className="mr-3 text-blue-500 bg-blue-50 p-2 rounded-full text-3xl" />
            {editingId ? "Edit Teacher" : "Add New Teacher"}
          </h2>

          <form onSubmit={submitHandler} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g. Dr. Jane Smith"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="jane@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Qualification
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="M.Sc. Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="+1 234 567 890"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-4"
              disabled={loading}>
              {loading ? "Adding..." : "Add Teacher"}
            </button>
          </form>
        </motion.div>

        {/* Teacher List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">
              Teacher Directory
            </h2>
            <input
              type="text"
              placeholder="Search teachers..."
              className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="overflow-y-auto overflow-x-auto flex-1 p-4">
            {teachers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No teachers found.</p>
                <p className="text-gray-400 text-sm">
                  Add a new teacher to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-4">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className={`bg-gray-50 p-4 rounded-xl border ${
                        editingId === teacher._id
                          ? "border-amber-300 bg-amber-50"
                          : "border-gray-100"
                      }`}>
                      {editingId === teacher._id ? (
                        <div className="space-y-3">
                          <div>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="Email"
                            />
                          </div>
                          <div>
                            <input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="New Password (leave blank to keep current)"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={editQualification}
                              onChange={(e) =>
                                setEditQualification(e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="Qualification"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder="Phone"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEdit}
                              className="flex-1 text-gray-600 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">
                              Cancel
                            </button>
                            <button
                              onClick={() => updateTeacher(teacher._id)}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                              disabled={editLoading}>
                              {editLoading ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-gray-800">
                                {teacher.name}
                              </h3>
                              <p className="text-xs text-gray-500 break-all">
                                {teacher.email}
                              </p>
                            </div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                              {teacher.qualification || "N/A"}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded text-sm text-gray-600 mb-3">
                            Phone:{" "}
                            <span className="font-semibold">
                              {teacher.phone || "-"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(teacher)}
                              className="flex-1 text-blue-600 bg-blue-50 border border-blue-100 font-semibold py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                              <FaEdit /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(teacher._id)}
                              className="flex-1 text-red-500 bg-white border border-red-100 font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                              <FaTrash /> Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <table className="min-w-full hidden md:table">
                  <thead className="bg-blue-50 rounded-lg text-blue-800">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider rounded-l-lg">
                        Name
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">
                        Qualification
                      </th>
                      <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider rounded-r-lg">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teachers.map((teacher) => (
                      <tr
                        key={teacher._id}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          editingId === teacher._id ? "bg-amber-50" : ""
                        }`}>
                        <td className="py-4 px-4">
                          {editingId === teacher._id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                              placeholder="Full Name"
                            />
                          ) : (
                            <div className="font-semibold text-gray-800">
                              {teacher.name}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingId === teacher._id ? (
                            <div className="space-y-1">
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                                placeholder="Email"
                              />
                              <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                                placeholder="Phone"
                              />
                              <input
                                type="password"
                                value={editPassword}
                                onChange={(e) =>
                                  setEditPassword(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                                placeholder="New Password"
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              <div>{teacher.email}</div>
                              <div className="text-xs text-gray-400">
                                {teacher.phone}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingId === teacher._id ? (
                            <input
                              type="text"
                              value={editQualification}
                              onChange={(e) =>
                                setEditQualification(e.target.value)
                              }
                              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                              placeholder="Qualification"
                            />
                          ) : (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              {teacher.qualification || "N/A"}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {editingId === teacher._id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={cancelEdit}
                                className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100"
                                title="Cancel">
                                <FaTimes />
                              </button>
                              <button
                                onClick={() => updateTeacher(teacher._id)}
                                className="text-green-500 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-green-50"
                                disabled={editLoading}
                                title="Save">
                                <FaSave />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => startEdit(teacher)}
                                className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                                title="Edit">
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(teacher._id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                title="Delete">
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Teachers;
