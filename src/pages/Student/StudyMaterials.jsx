import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaFilePdf,
  FaVideo,
  FaLink,
  FaFileAlt,
  FaSearch,
  FaDownload,
  FaFileWord,
  FaFilePowerpoint,
  FaImage,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useSelector } from "react-redux";

const StudyMaterials = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentSemester, setStudentSemester] = useState(null);

  useEffect(() => {
    if (userInfo?._id) {
      fetchData();
    }
  }, [userInfo]);

  // Helper function to get correct file URL
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return "#";
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const cleanBaseUrl = baseUrl.replace("/api", "");
    return `${cleanBaseUrl}${fileUrl}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get student's semester first
      const studentResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/students/${userInfo._id}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );

      const semester = studentResponse.data.semester;
      setStudentSemester(semester);

      if (semester?._id) {
        // Fetch materials for student's semester
        const materialsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/materials?semesterId=${semester._id}`,
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          },
        );
        setMaterials(materialsRes.data);

        // Get unique subjects from materials
        const uniqueSubjects = [];
        const subjectIds = new Set();

        materialsRes.data.forEach((material) => {
          if (material.subject && !subjectIds.has(material.subject._id)) {
            subjectIds.add(material.subject._id);
            uniqueSubjects.push(material.subject);
          }
        });

        setSubjects(uniqueSubjects);
      } else {
        setMaterials([]);
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching study materials:", error);
      setMaterials([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "PDF":
        return <FaFilePdf className="text-red-500 text-2xl" />;
      case "Video":
        return <FaVideo className="text-blue-500 text-2xl" />;
      case "Document":
        return <FaFileWord className="text-blue-600 text-2xl" />;
      case "Presentation":
        return <FaFilePowerpoint className="text-orange-500 text-2xl" />;
      case "Image":
        return <FaImage className="text-green-500 text-2xl" />;
      default:
        return <FaFileAlt className="text-gray-500 text-2xl" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSubject =
      selectedSubject === "All" || material.subject?._id === selectedSubject;
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description &&
        material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Study <span className="text-blue-600">Materials</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Access your course resources and learning materials
        </p>

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
            onClick={fetchData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Refresh Status
          </button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedSubject("All")}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                All Subjects
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject._id}
                  onClick={() => setSelectedSubject(subject._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedSubject === subject._id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {subject.name}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Materials Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-lg">
                {searchTerm || selectedSubject !== "All"
                  ? "No materials match your search criteria"
                  : "No study materials available for your semester yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material, index) => (
                <motion.div
                  key={material._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {getIcon(material.type)}
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {material.subject?.name || "No Subject"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {material.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {material.description || "No description provided"}
                    </p>

                    <div className="mt-auto">
                      <div className="text-xs text-gray-400 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="truncate mr-2">
                            {material.fileName}
                          </span>
                          <span className="flex-shrink-0">
                            {formatFileSize(material.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <p>
                          Uploaded by{" "}
                          <span className="font-medium">
                            {material.uploadedBy?.name || "Teacher"}
                          </span>
                        </p>
                        <p>
                          {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={getFileUrl(material.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors group">
                        <FaDownload className="group-hover:translate-y-[-2px] transition-transform" />
                        Download
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudyMaterials;
