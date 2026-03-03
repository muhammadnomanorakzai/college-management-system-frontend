import React, { useState, useEffect } from "react";
import api from "../../utils/axiosConfig";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaTimes,
  FaSave,
  FaUser,
  FaSync,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Add Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  // Edit States
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSelectedSemester, setEditSelectedSemester] = useState("");
  const [editRollNumber, setEditRollNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchStudents = async () => {
    try {
      setFetching(true);
      const { data } = await api.get("/students");
      console.log("Fetched students:", data); // Debug log
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students. Please check your connection.");
    } finally {
      setFetching(false);
    }
  };

  const fetchSemesters = async () => {
    try {
      const { data } = await api.get("/semesters");
      const activeSemesters = data
        .filter((s) => s.isActive)
        .sort((a, b) => a.semesterNumber - b.semesterNumber);
      setSemesters(activeSemesters);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast.error("Failed to load semesters");
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSemesters();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Changed 'semester' to 'studentClass' to match backend
      await api.post("/students", {
        name,
        email,
        password,
        role: "Student",
        studentClass: selectedSemester, // ✅ Changed here
        rollNumber,
      });

      toast.success("Student added successfully");
      resetForm();
      fetchStudents();
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Error adding student";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setSelectedSemester("");
    setRollNumber("");
  };

  const startEdit = (student) => {
    console.log("student data:", student); // Debug log

    setEditingId(student._id);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditPassword("");

    // ✅ FIX: Use studentClass instead of semester
    setEditSelectedSemester(
      typeof student.studentClass === "object"
        ? student.studentClass._id
        : student.studentClass || "",
    );

    setEditRollNumber(student.rollNumber || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setEditPassword("");
    setEditSelectedSemester("");
    setEditRollNumber("");
  };

  const updateStudent = async (id) => {
    setEditLoading(true);

    try {
      const updateData = {
        name: editName,
        email: editEmail,
        studentClass: editSelectedSemester, // ✅ Changed here
        rollNumber: editRollNumber,
      };

      // Only include password if it was changed
      if (editPassword.trim()) {
        updateData.password = editPassword;
      }

      // Use the general users endpoint for updates
      await api.put(`/users/${id}`, updateData);

      setEditingId(null);
      toast.success("Student updated successfully");
      fetchStudents();
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Error updating student";
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;

    try {
      await api.delete(`/students/${studentId}`);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Error deleting student";
      toast.error(message);
    }
  };

  const refreshData = () => {
    fetchStudents();
    fetchSemesters();
  };

  const getSemesterInfo = (student) => {
    // ✅ FIX: Use studentClass instead of semester
    if (!student.studentClass)
      return { number: "N/A", name: "Unassigned", academicSession: "" };

    // If studentClass is populated as object
    if (typeof student.studentClass === "object") {
      return {
        number: student.studentClass.semesterNumber || "N/A",
        name: student.studentClass.name || "No name",
        academicSession: student.studentClass.academicSession?.name || "",
      };
    }

    // If studentClass is just an ID string
    const foundSem = semesters.find((s) => s._id === student.studentClass);
    if (foundSem) {
      return {
        number: foundSem.semesterNumber,
        name: foundSem.name,
        academicSession: foundSem.academicSession?.name || "",
      };
    }

    return { number: "N/A", name: "Unknown Semester", academicSession: "" };
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
            Manage <span className="text-blue-600">Students</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add, edit, and manage student records
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            title="Refresh data">
            <FaSync className={fetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <span className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
            Total:{" "}
            <span className="font-bold text-gray-800">{students.length}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Student Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 sm:p-6 rounded-xl shadow-lg border border-gray-100 h-fit lg:col-span-1">
          <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="bg-blue-50 p-2 rounded-lg">
              <FaPlus className="text-blue-500 text-lg" />
            </div>
            {editingId ? "Edit Student" : "Add New Student"}
          </h2>

          <form onSubmit={submitHandler} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Semester *
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
                  required>
                  <option value="">Select Semester</option>
                  {semesters.length === 0 && (
                    <option disabled>No semesters available</option>
                  )}
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Sem {semester.semesterNumber}: {semester.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
                  placeholder="101"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </button>
          </form>
        </motion.div>

        {/* Student List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">
              Student Directory
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-auto flex-1 p-4">
            {fetching ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gray-100 rounded-full p-6 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FaUser className="text-gray-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-lg">No students found.</p>
                <p className="text-gray-400 text-sm">
                  Add a new student to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-4">
                  {students.map((student) => {
                    const semesterInfo = getSemesterInfo(student);
                    return (
                      <div
                        key={student._id}
                        className={`bg-gray-50 p-4 rounded-xl border ${
                          editingId === student._id
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-100"
                        }`}>
                        {editingId === student._id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                placeholder="Full Name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                placeholder="Email"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                New Password (optional)
                              </label>
                              <input
                                type="password"
                                value={editPassword}
                                onChange={(e) =>
                                  setEditPassword(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                placeholder="Leave blank to keep current"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Semester
                                </label>
                                <select
                                  value={editSelectedSemester}
                                  onChange={(e) =>
                                    setEditSelectedSemester(e.target.value)
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                  required>
                                  <option value="">Select</option>
                                  {semesters.map((semester) => (
                                    <option
                                      key={semester._id}
                                      value={semester._id}>
                                      Sem {semester.semesterNumber}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Roll No
                                </label>
                                <input
                                  type="text"
                                  value={editRollNumber}
                                  onChange={(e) =>
                                    setEditRollNumber(e.target.value)
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                  placeholder="Roll No"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={cancelEdit}
                                className="flex-1 text-gray-600 bg-gray-100 py-2 rounded-lg hover:bg-gray-200 font-medium">
                                Cancel
                              </button>
                              <button
                                onClick={() => updateStudent(student._id)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                                disabled={editLoading}>
                                {editLoading ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {student.name}
                                </h3>
                                <p className="text-sm text-gray-500 break-all mt-1">
                                  {student.email}
                                </p>
                              </div>
                              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap">
                                Sem {semesterInfo.number}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                              <div className="bg-white p-2 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 block">
                                  Roll Number
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {student.rollNumber || "-"}
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 block">
                                  Semester
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {semesterInfo.name}
                                  {semesterInfo.academicSession && (
                                    <span className="text-gray-500 block text-xs">
                                      {semesterInfo.academicSession}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(student)}
                                className="flex-1 text-blue-600 bg-blue-50 border border-blue-100 font-semibold py-2.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                <FaEdit /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(student._id)}
                                className="flex-1 text-red-600 bg-white border border-red-100 font-semibold py-2.5 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                <FaTrash /> Remove
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View - Table */}
                <table className="min-w-full hidden md:table">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-bold text-blue-800 uppercase">
                        Name
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-blue-800 uppercase">
                        Semester
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-blue-800 uppercase">
                        Roll No
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-blue-800 uppercase">
                        Contact
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-blue-800 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const semesterInfo = getSemesterInfo(student);
                      return (
                        <tr
                          key={student._id}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            editingId === student._id ? "bg-blue-50" : ""
                          }`}>
                          <td className="py-4 px-4">
                            {editingId === student._id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                placeholder="Full Name"
                                required
                              />
                            ) : (
                              <div className="font-semibold text-gray-800 text-base">
                                {student.name}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {editingId === student._id ? (
                              <select
                                value={editSelectedSemester}
                                onChange={(e) =>
                                  setEditSelectedSemester(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                required>
                                <option value="">Select Semester</option>
                                {semesters.map((semester) => (
                                  <option
                                    key={semester._id}
                                    value={semester._id}>
                                    Sem {semester.semesterNumber}:{" "}
                                    {semester.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-bold">
                                    Semester {semesterInfo.number}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {semesterInfo.name}
                                  {semesterInfo.academicSession && (
                                    <span className="text-gray-500 ml-2">
                                      ({semesterInfo.academicSession})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {editingId === student._id ? (
                              <input
                                type="text"
                                value={editRollNumber}
                                onChange={(e) =>
                                  setEditRollNumber(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-mono"
                                placeholder="Roll No"
                              />
                            ) : (
                              <span className="font-mono text-base text-gray-800 font-medium">
                                {student.rollNumber || "-"}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {editingId === student._id ? (
                              <div className="space-y-2">
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                  placeholder="Email"
                                  required
                                />
                                <input
                                  type="password"
                                  value={editPassword}
                                  onChange={(e) =>
                                    setEditPassword(e.target.value)
                                  }
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                                  placeholder="New Password (optional)"
                                />
                              </div>
                            ) : (
                              <div className="text-base text-gray-600">
                                {student.email}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {editingId === student._id ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
                                  title="Cancel">
                                  <FaTimes />
                                </button>
                                <button
                                  onClick={() => updateStudent(student._id)}
                                  className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                  disabled={editLoading}
                                  title="Save">
                                  <FaSave />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEdit(student)}
                                  className="text-blue-600 hover:text-blue-700 transition-colors p-2.5 rounded-lg hover:bg-blue-50"
                                  title="Edit">
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(student._id)}
                                  className="text-red-600 hover:text-red-700 transition-colors p-2.5 rounded-lg hover:bg-red-50"
                                  title="Delete">
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

export default Students;
