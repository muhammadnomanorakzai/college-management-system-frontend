import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaClipboardList,
  FaFileUpload,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaDownload,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const Assignments = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentSemester, setStudentSemester] = useState(null);
  const [filter, setFilter] = useState("All");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionFileName, setSubmissionFileName] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo?._id) {
      fetchStudentData();
    }
  }, [userInfo]);

  // Helper function to get correct file URL
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return "#";
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const cleanBaseUrl = baseUrl.replace("/api", "");
    return `${cleanBaseUrl}${fileUrl}`;
  };

  const fetchStudentData = async () => {
    setFetching(true);
    try {
      // Fetch student data to get semester
      const studentResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/students/${userInfo._id}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );

      const semester = studentResponse.data.semester;
      setStudentSemester(semester);

      if (semester?._id) {
        // Fetch assignments for student's semester
        await fetchAssignments(semester._id);
        await fetchSubmissions();
      } else {
        setAssignments([]);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Error loading your data");
    } finally {
      setFetching(false);
    }
  };

  const fetchAssignments = async (semesterId) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/assignments?semesterId=${semesterId}`,
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

  const fetchSubmissions = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/submissions?studentId=${userInfo._id}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
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
      setSubmissionFile(selectedFile);
      setSubmissionFileName(selectedFile.name);
    }
  };

  const removeFile = () => {
    setSubmissionFile(null);
    setSubmissionFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    // Check if both file and text are empty
    if (!submissionFile && !submissionText.trim()) {
      toast.error("Please provide either a file upload or text submission");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("assignment", selectedAssignment._id);
      formData.append("text", submissionText);

      if (submissionFile) {
        formData.append("file", submissionFile);
      }

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

      await axios.post(
        `${import.meta.env.VITE_API_URL}/submissions`,
        formData,
        config,
      );

      toast.success("Assignment submitted successfully!");

      // Reset form
      setSubmissionText("");
      setSubmissionFile(null);
      setSubmissionFileName("");
      setSelectedAssignment(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchSubmissions();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error.response?.data?.message || "Error submitting assignment",
      );
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(
      (s) => s.assignment?._id === assignmentId,
    );
    if (!submission)
      return { status: "Pending", color: "yellow", icon: <FaClock /> };
    if (submission.status === "Graded")
      return { status: "Graded", color: "green", icon: <FaCheckCircle /> };
    if (submission.status === "Late")
      return { status: "Late", color: "red", icon: <FaExclamationCircle /> };
    return { status: "Submitted", color: "blue", icon: <FaCheckCircle /> };
  };

  const isOverdue = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFileAlt className="text-gray-500 text-sm" />;

    if (fileType.includes("pdf"))
      return <FaFilePdf className="text-red-500 text-sm" />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FaFileWord className="text-blue-600 text-sm" />;
    return <FaFileAlt className="text-gray-500 text-sm" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const status = getSubmissionStatus(assignment._id).status;
    if (filter === "All") return true;
    if (filter === "Pending") return status === "Pending";
    if (filter === "Submitted")
      return status === "Submitted" || status === "Late";
    if (filter === "Graded") return status === "Graded";
    return true;
  });

  const getStatusColorClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Submitted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Late":
        return "bg-red-50 text-red-700 border-red-200";
      case "Graded":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (fetching) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          My <span className="text-blue-600">Assignments</span>
        </h1>
        <p className="text-gray-500 mt-2">View and submit your assignments</p>

        {studentSemester && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Current Semester:</span>{" "}
            {studentSemester.name}
            {studentSemester.academicSession &&
              ` (${studentSemester.academicSession.name})`}
          </div>
        )}
      </div>

      {!studentSemester ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No Semester Assigned
          </h3>
          <p className="text-gray-600 mb-4">
            You are not currently assigned to any semester. Please contact your
            administrator.
          </p>
          <button
            onClick={fetchStudentData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Refresh Status
          </button>
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {["All", "Pending", "Submitted", "Graded"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === tab
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Assignments List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredAssignments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-lg">No assignments found.</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filter === "All"
                    ? "You have no assignments in this semester yet."
                    : `No ${filter.toLowerCase()} assignments.`}
                </p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const submissionStatus = getSubmissionStatus(assignment._id);
                const submission = submissions.find(
                  (s) => s.assignment?._id === assignment._id,
                );
                const overdue = isOverdue(assignment.dueDate) && !submission;

                return (
                  <motion.div
                    key={assignment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">
                            {assignment.title}
                          </h3>
                          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                            Assignment
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {assignment.description}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColorClass(submissionStatus.status)}`}>
                        {submissionStatus.icon}
                        <span className="font-semibold text-sm">
                          {submissionStatus.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
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
                        <p className="text-gray-500">Due Date</p>
                        <p
                          className={`font-semibold ${overdue ? "text-red-600" : "text-gray-800"}`}>
                          {new Date(assignment.dueDate).toLocaleDateString()}
                          {overdue && " (Overdue)"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Points</p>
                        <p className="font-semibold text-gray-800">
                          {assignment.totalPoints}
                        </p>
                      </div>
                    </div>

                    {/* Assignment File Section */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Assignment File:
                        </p>
                        <button
                          onClick={() =>
                            window.open(
                              getFileUrl(assignment.fileUrl),
                              "_blank",
                            )
                          }
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                          <FaDownload className="text-xs" />
                          Download
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded border border-blue-200">
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

                    {/* Submission Section */}
                    {submission ? (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              Your Submission:
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted:{" "}
                              {new Date(
                                submission.submittedAt,
                              ).toLocaleString()}
                            </p>
                          </div>
                          {submission.status === "Graded" && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              Graded
                            </span>
                          )}
                        </div>

                        {submission.text && (
                          <p className="text-sm text-gray-600 mb-3 bg-white p-3 rounded border border-gray-200">
                            {submission.text}
                          </p>
                        )}

                        {submission.fileUrl && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 bg-white p-3 rounded border border-gray-200">
                              <div className="p-2 bg-gray-100 rounded">
                                {getFileIcon(submission.fileType)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {submission.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(submission.fileSize)}
                                </p>
                              </div>
                              <a
                                href={getFileUrl(submission.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700">
                                <FaDownload />
                              </a>
                            </div>
                          </div>
                        )}

                        {submission.grade !== undefined && (
                          <div className="pt-3 border-t border-gray-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-700">
                                  Grade:{" "}
                                  <span className="text-green-600">
                                    {submission.grade}/{assignment.totalPoints}
                                  </span>
                                </p>
                                {submission.feedback && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    <span className="font-semibold">
                                      Feedback:
                                    </span>{" "}
                                    {submission.feedback}
                                  </p>
                                )}
                              </div>
                              {submission.status === "Late" && (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                  Submitted Late
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {selectedAssignment?._id === assignment._id ? (
                          <form
                            onSubmit={submitAssignment}
                            className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-2">
                                Text Submission (Optional)
                              </label>
                              <textarea
                                value={submissionText}
                                onChange={(e) =>
                                  setSubmissionText(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                rows="3"
                                placeholder="Enter your submission text here..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-2">
                                Or Upload File (Optional)
                              </label>
                              <div
                                onClick={triggerFileInput}
                                className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer min-h-[100px] flex flex-col items-center justify-center">
                                {submissionFile ? (
                                  <div className="space-y-2 w-full">
                                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                      <div className="flex items-center">
                                        {getFileIcon(submissionFile.type)}
                                        <div className="ml-3 text-left">
                                          <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                                            {submissionFileName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatFileSize(
                                              submissionFile.size,
                                            )}
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
                                    {uploadProgress > 0 &&
                                      uploadProgress < 100 && (
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${uploadProgress}%`,
                                            }}></div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {uploadProgress}% uploaded
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                ) : (
                                  <>
                                    <FaFileUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-1">
                                      Click to upload file
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      PDF, Word, Images (Max 50MB)
                                    </p>
                                  </>
                                )}
                                {/* Hidden file input */}
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  onChange={handleFileChange}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                Provide either text or file submission (or both)
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  loading ||
                                  (!submissionText.trim() && !submissionFile)
                                }>
                                {loading
                                  ? "Submitting..."
                                  : "Submit Assignment"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAssignment(null);
                                  setSubmissionText("");
                                  setSubmissionFile(null);
                                  setSubmissionFileName("");
                                }}
                                className="bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={overdue}>
                            {overdue
                              ? "Assignment Overdue"
                              : "Submit Assignment"}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Assignments;
