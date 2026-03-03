import React, { useState, useEffect } from "react";
import api from "../../utils/axiosConfig";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaBook,
  FaEdit,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Add form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [credits, setCredits] = useState(3);
  const [description, setDescription] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSelectedSemester, setEditSelectedSemester] = useState("");
  const [editSelectedTeacher, setEditSelectedTeacher] = useState("");
  const [editCredits, setEditCredits] = useState(3);
  const [editDescription, setEditDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get("/subjects");
      setSubjects(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const { data } = await api.get("/semesters");
      setSemesters(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get("/teachers");
      setTeachers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchSemesters();
    fetchTeachers();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/subjects", {
        name,
        code: code.toUpperCase(),
        semester: selectedSemester,
        teacher: selectedTeacher,
        credits,
        description,
      });

      setLoading(false);
      toast.success("Subject added successfully");
      resetForm();
      fetchSubjects();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setSelectedSemester("");
    setSelectedTeacher("");
    setCredits(3);
    setDescription("");
  };

  const startEdit = (subject) => {
    setEditingId(subject._id);
    setEditName(subject.name);
    setEditCode(subject.code);
    setEditSelectedSemester(subject.semester?._id || "");
    setEditSelectedTeacher(subject.teacher?._id || "");
    setEditCredits(subject.credits);
    setEditDescription(subject.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCode("");
    setEditSelectedSemester("");
    setEditSelectedTeacher("");
    setEditCredits(3);
    setEditDescription("");
  };

  const updateSubject = async (id) => {
    setEditLoading(true);

    try {
      await api.put(`/subjects/${id}`, {
        name: editName,
        code: editCode.toUpperCase(),
        semester: editSelectedSemester,
        teacher: editSelectedTeacher,
        credits: editCredits,
        description: editDescription,
      });

      setEditLoading(false);
      setEditingId(null);
      toast.success("Subject updated successfully");
      fetchSubjects();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
      setEditLoading(false);
    }
  };

  const deleteSubject = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await api.delete(`/subjects/${id}`);
        toast.success("Subject deleted successfully");
        fetchSubjects();
      } catch (error) {
        console.error(error);
        toast.error("Error deleting subject");
      }
    }
  };

  const formatSemesterDisplay = (semester) => {
    if (!semester) return "";
    return `Semester ${semester.semesterNumber} - ${semester.name} (${semester.academicSession?.name || ""})`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Manage <span className="text-blue-600">Subjects</span>
        </h1>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
          Total Subjects:{" "}
          <span className="font-bold text-gray-800">{subjects.length}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Subject Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-fit lg:col-span-1">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4 border-gray-100">
            <FaPlus className="mr-3 text-blue-500 bg-blue-50 p-2 rounded-full text-3xl" />
            {editingId ? "Edit Subject" : "Add New Subject"}
          </h2>

          <form onSubmit={submitHandler} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g. Mathematics"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Subject Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white uppercase"
                placeholder="e.g. MATH101"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                required>
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    {formatSemesterDisplay(semester)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                required>
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Credits
              </label>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                min="1"
                max="6"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                rows="3"
                placeholder="Brief description of the subject"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-4"
              disabled={loading}>
              {loading ? "Adding..." : "Add Subject"}
            </button>
          </form>
        </motion.div>

        {/* Subject List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col h-[500px] md:h-[700px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaBook className="text-blue-500" /> Subject Directory
            </h2>
          </div>

          <div className="overflow-y-auto flex-1 p-4">
            {subjects.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No subjects found.</p>
                <p className="text-gray-400 text-sm">
                  Add a new subject to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <div
                    key={subject._id}
                    className={`p-5 rounded-xl border hover:shadow-lg transition-shadow ${
                      editingId === subject._id
                        ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                        : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
                    }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {subject.name}
                        </h3>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                          {subject.code}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {editingId === subject._id ? (
                          <>
                            <button
                              onClick={() => cancelEdit()}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                              title="Cancel">
                              <FaTimes />
                            </button>
                            <button
                              onClick={() => updateSubject(subject._id)}
                              className="text-green-500 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-green-50"
                              disabled={editLoading}
                              title="Save">
                              <FaSave />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(subject)}
                              className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                              title="Edit">
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteSubject(subject._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                              title="Delete">
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === subject._id ? (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            placeholder="Subject Name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm uppercase"
                            placeholder="Subject Code"
                          />
                        </div>
                        <div>
                          <select
                            value={editSelectedSemester}
                            onChange={(e) =>
                              setEditSelectedSemester(e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm">
                            <option value="">Select Semester</option>
                            {semesters.map((semester) => (
                              <option key={semester._id} value={semester._id}>
                                {formatSemesterDisplay(semester)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={editSelectedTeacher}
                            onChange={(e) =>
                              setEditSelectedTeacher(e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm">
                            <option value="">Select Teacher</option>
                            {teachers.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editCredits}
                            onChange={(e) => setEditCredits(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            min="1"
                            max="6"
                          />
                          <button
                            type="button"
                            onClick={() => updateSubject(subject._id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            disabled={editLoading}>
                            {editLoading ? "Saving..." : "Save"}
                          </button>
                        </div>
                        <div>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            rows="2"
                            placeholder="Description"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Semester:</span>
                            <span className="font-semibold text-gray-800">
                              {subject.semester ? (
                                <>
                                  Semester {subject.semester.semesterNumber} -{" "}
                                  {/* {subject.semester.name} */}
                                  {subject.semester.academicSession && (
                                    <span className="text-gray-500 text-xs ml-1">
                                      ({subject.semester.academicSession.name})
                                    </span>
                                  )}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Teacher:</span>
                            <span className="font-semibold text-gray-800">
                              {subject.teacher?.name || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Credits:</span>
                            <span className="font-semibold text-gray-800">
                              {subject.credits}
                            </span>
                          </div>
                        </div>

                        {subject.description && (
                          <p className="mt-3 text-xs text-gray-600 italic border-t border-blue-200 pt-2">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subjects;
