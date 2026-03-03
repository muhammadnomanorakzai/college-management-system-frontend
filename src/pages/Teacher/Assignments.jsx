import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaClipboardList,
  FaPlus,
  FaTrash,
  FaDownload,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFilePowerpoint,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const Assignments = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalPoints, setTotalPoints] = useState("100");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo?._id) {
      fetchAssignments();
      fetchSubjects();
      fetchSemesters();
    }
  }, [userInfo]);

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/assignments?teacherId=${userInfo._id}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Error fetching assignments");
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/subjects?teacherId=${userInfo._id}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );
      console.log("Fetched subjects:", data);
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Error fetching subjects");
    }
  };

  const fetchSemesters = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/semesters`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );
      setSemesters(data);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast.error("Error fetching semesters");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please upload an assignment file");
      return;
    }

    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    if (!selectedSemester) {
      toast.error("Please select a semester");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("subject", selectedSubject);
      formData.append("semester", selectedSemester);
      formData.append("dueDate", dueDate);
      formData.append("totalPoints", totalPoints);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo.token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/assignments`,
        formData,
        config,
      );

      toast.success("Assignment created successfully!");

      // Reset form
      setTitle("");
      setSelectedSubject("");
      setSelectedSemester("");
      setDueDate("");
      setTotalPoints("100");
      setDescription("");
      setFile(null);
      setFileName("");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchAssignments();
    } catch (error) {
      console.error("Assignment creation error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error creating assignment";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/assignments/${id}`,
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          },
        );
        toast.success("Assignment deleted successfully");
        fetchAssignments();
      } catch (error) {
        console.error(error);
        toast.error("Error deleting assignment");
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFileAlt className="text-gray-500 text-xl" />;

    if (fileType.includes("pdf"))
      return <FaFilePdf className="text-red-500 text-xl" />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FaFileWord className="text-blue-600 text-xl" />;
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return <FaFilePowerpoint className="text-orange-500 text-xl" />;
    return <FaFileAlt className="text-gray-500 text-xl" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSemesterDisplay = (semester) => {
    if (!semester) return "";
    return `Semester ${semester.semesterNumber} - ${semester.name}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-700";
      case "Submitted":
        return "bg-purple-100 text-purple-700";
      case "Graded":
        return "bg-green-100 text-green-700";
      case "Overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Manage <span className="text-blue-600">Assignments</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Create and manage assignments for your students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-4">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4 border-gray-100">
              <FaPlus className="mr-3 text-blue-500 bg-blue-50 p-2 rounded-full text-3xl" />
              Create New Assignment
            </h2>

            <form onSubmit={submitHandler} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                  placeholder="e.g. Math Assignment - Chapter 5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                  required>
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} {subject.code && `(${subject.code})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                  required>
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      {formatSemesterDisplay(semester)}
                      {semester.academicSession &&
                        ` (${semester.academicSession.name})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                  rows="3"
                  placeholder="Brief description of the assignment..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Assignment File
                </label>
                <div
                  onClick={triggerFileInput}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer min-h-[120px] flex flex-col items-center justify-center">
                  {file ? (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div className="flex items-center">
                          {getFileIcon(file.type)}
                          <div className="ml-3 text-left">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                              {fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className="text-gray-400 hover:text-red-500">
                          <FaTimes />
                        </button>
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}></div>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadProgress}% uploaded
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload assignment file
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, Word, PPT, Images, ZIP (Max 50MB)
                      </p>
                    </>
                  )}
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar,.txt"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Upload the assignment questions or instructions file
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  loading || !file || !selectedSubject || !selectedSemester
                }>
                {loading ? "Creating..." : "Create Assignment"}
              </button>
            </form>
          </div>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              My Assignments ({assignments.length})
            </h2>

            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No assignments created yet.
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Create your first assignment using the form
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">
                          {assignment.title}
                        </h3>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Due:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`${import.meta.env.VITE_API_URL.replace("/api", "")}${assignment.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Download Assignment">
                          <FaDownload />
                        </a>
                        <button
                          onClick={() => deleteAssignment(assignment._id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          title="Delete Assignment">
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Subject</p>
                        <p className="font-semibold text-gray-800">
                          {assignment.subject?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Semester</p>
                        <p className="font-semibold text-gray-800">
                          {assignment.semester ? (
                            <>
                              Semester {assignment.semester.semesterNumber}
                              {assignment.semester.academicSession && (
                                <span className="text-gray-500 text-xs ml-1">
                                  ({assignment.semester.academicSession.name})
                                </span>
                              )}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Points</p>
                        <p className="font-semibold text-gray-800">
                          {assignment.totalPoints}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-white rounded border border-gray-200">
                            {getFileIcon(assignment.fileType)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {assignment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(assignment.fileSize)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
