import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaTrash,
  FaDownload,
  FaFileAlt,
  FaPlus,
  FaFilePdf,
  FaVideo,
  FaFileWord,
  FaFilePowerpoint,
  FaImage,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const Materials = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("PDF");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  // Add a ref for the file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo?._id) {
      fetchSubjects();
    }
  }, [userInfo]);

  useEffect(() => {
    if (selectedSubject) {
      fetchMaterials();
    }
  }, [selectedSubject]);

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

  const fetchMaterials = async () => {
    try {
      console.log("Fetching materials for subject:", selectedSubject);
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/materials?subjectId=${selectedSubject}`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );
      console.log("Fetched materials:", data);
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Error fetching materials");
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

      // Determine file type
      const fileType = selectedFile.type;
      let detectedType = "Document";

      if (fileType === "application/pdf") detectedType = "PDF";
      else if (fileType.includes("word")) detectedType = "Document";
      else if (
        fileType.includes("powerpoint") ||
        fileType.includes("presentation")
      )
        detectedType = "Presentation";
      else if (fileType.includes("image")) detectedType = "Image";
      else if (fileType.includes("video")) detectedType = "Video";

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setType(detectedType); // Auto-set type based on file
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!selectedSubject) {
      toast.error("Please select a subject");
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
      formData.append("type", type);

      // Find subject to get semester
      const subjectObj = subjects.find((s) => s._id === selectedSubject);
      console.log("Selected subject object:", subjectObj);

      if (subjectObj?.semester?._id) {
        formData.append("semester", subjectObj.semester._id);
        console.log("Added semester:", subjectObj.semester._id);
      } else {
        console.log("No semester found for subject");
      }

      console.log("Uploading material...");
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
        `${import.meta.env.VITE_API_URL}/materials`,
        formData,
        config,
      );

      console.log("Upload response:", data);
      toast.success("Material uploaded successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setType("PDF");
      setFile(null);
      setFileName("");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchMaterials();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error uploading material";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?"))
      return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/materials/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      toast.success("Material deleted successfully");
      fetchMaterials();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting material");
    }
  };

  const getIcon = (fileType) => {
    switch (fileType) {
      case "PDF":
        return <FaFilePdf className="text-red-500 text-xl" />;
      case "Video":
        return <FaVideo className="text-blue-500 text-xl" />;
      case "Document":
        return <FaFileWord className="text-blue-600 text-xl" />;
      case "Presentation":
        return <FaFilePowerpoint className="text-orange-500 text-xl" />;
      case "Image":
        return <FaImage className="text-green-500 text-xl" />;
      default:
        return <FaFileAlt className="text-gray-500 text-xl" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getSubjectDisplay = (subject) => {
    if (!subject) return "";
    let display = subject.name;
    if (subject.semester) {
      display += ` (Sem ${subject.semester.semesterNumber})`;
      if (subject.semester.academicSession?.name) {
        display += ` - ${subject.semester.academicSession.name}`;
      }
    }
    return display;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Course <span className="text-blue-600">Materials</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Upload and share study resources with your students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaPlus className="mr-2 text-blue-600" />
              Upload New Material
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  required>
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {getSubjectDisplay(s)}
                    </option>
                  ))}
                </select>
                {selectedSubject && (
                  <p className="text-xs text-gray-500 mt-1">
                    {subjects.find((s) => s._id === selectedSubject)?.semester
                      ? "Semester found ✓"
                      : "⚠️ No semester assigned to this subject"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Chapter 1 Notes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Describe the content of this material"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  File Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="PDF">PDF Document</option>
                  <option value="Document">Word Document</option>
                  <option value="Presentation">PowerPoint/PDF Slides</option>
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Upload File
                </label>
                <div
                  onClick={triggerFileInput}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer min-h-[120px] flex flex-col items-center justify-center">
                  {file ? (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div className="flex items-center">
                          {getIcon(type)}
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
                            e.stopPropagation(); // Prevent triggering file input
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
                        Click to select a file
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, Word, PPT, Images, Videos (Max 50MB)
                      </p>
                    </>
                  )}
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.txt"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Click the box above to select a file
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedSubject || !file}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Uploading..." : "Upload Material"}
              </button>
            </form>
          </div>
        </div>

        {/* Materials List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Uploaded Materials
            </h2>

            {!selectedSubject ? (
              <div className="text-center py-12 text-gray-400">
                Select a subject to view materials
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No materials uploaded yet
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <motion.div
                    key={material._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex gap-4 items-start w-full">
                        <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm shrink-0">
                          {getIcon(material.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-lg break-words">
                            {material.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {material.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                              {material.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {material.fileName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatFileSize(material.fileSize)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(
                                material.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-start shrink-0">
                        <a
                          href={`${import.meta.env.VITE_API_URL.replace("/api", "")}${material.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center gap-1"
                          title="Download">
                          <FaDownload />
                        </a>
                        <button
                          onClick={() => handleDelete(material._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Materials;
