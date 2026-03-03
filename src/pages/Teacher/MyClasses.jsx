import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChalkboard, FaUserGraduate, FaVideo } from "react-icons/fa";
import { useSelector } from "react-redux";

const MyClasses = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (userInfo?._id) {
      fetchSubjects();
    }
  }, [userInfo]);

  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/subjects?teacherId=${userInfo._id}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );
      setSubjects(data);
    } catch (error) {
      console.error(error);
    }
  };

  const formatSemesterDisplay = (semester) => {
    if (!semester) return "N/A";
    return `Semester ${semester.semesterNumber} - ${semester.name}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          My <span className="text-blue-600">Classes</span>
        </h1>
        <p className="text-gray-500 mt-2">
          View your assigned subjects by semester
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-lg">No subjects assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <motion.div
              key={subject._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FaChalkboard className="text-2xl text-blue-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium mb-1">
                    {subject.code}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    {subject.credits} Credits
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {subject.name}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-gray-500">Semester:</span>
                  <span className="font-semibold text-gray-800">
                    {subject.semester ? (
                      <>
                        Semester {subject.semester.semesterNumber}
                        {subject.semester.name && (
                          <span className="ml-1">
                            - {subject.semester.name}
                          </span>
                        )}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-gray-500">Academic Session:</span>
                  <span className="font-semibold text-gray-800">
                    {subject.semester?.academicSession?.name || "N/A"}
                  </span>
                </div>
                {/* <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-gray-500">Session Type:</span>
                  <span
                    className={`font-semibold ${
                      subject.semester?.academicSession?.sessionType === "Fall"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}>
                    {subject.semester?.academicSession?.sessionType || "N/A"}
                  </span>
                </div> */}
              </div>

              {subject.description && (
                <p className="mt-4 text-xs text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                  {subject.description}
                </p>
              )}

              {/* <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <FaUserGraduate className="mr-2" />
                  <span>View students & manage grades</span>
                </div>
              </div> */}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
