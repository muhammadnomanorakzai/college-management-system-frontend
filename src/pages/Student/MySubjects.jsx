import React, { useState, useEffect } from "react";
import api from "../../utils/axiosConfig";
import { motion } from "framer-motion";
import {
  FaBook,
  FaStar,
  FaRegStar,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const MySubjects = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [subjects, setSubjects] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Enhanced review state
  const [evaluation, setEvaluation] = useState({
    courseContent: "",
    teachingMethod: "",
    communicationSkills: "",
    clarityOfExplanation: "",
    engagementInteraction: "",
    assignmentsPracticalWork: "",
    overallSatisfaction: "",
  });

  const [comment, setComment] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userInfo?._id) {
      fetchSubjects();
      fetchSubmittedReviews();
    }
  }, [userInfo]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data: studentData } = await api.get("/students");
      const student = studentData.find((s) => s._id === userInfo._id);

      if (student?.studentClass) {
        const { data } = await api.get(
          `/subjects?classId=${student.studentClass._id}`,
        );
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedReviews = async () => {
    try {
      const { data } = await api.get("/reviews/my-reviews");
      setSubmittedReviews(data.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const openReviewModal = (teacher, subject) => {
    if (!teacher || !teacher._id) {
      toast.error("Teacher information is missing");
      return;
    }

    if (!subject || !subject._id) {
      toast.error("Subject information is missing");
      return;
    }

    setSelectedTeacher(teacher);
    setSelectedSubject(subject);

    const existingReview = submittedReviews.find(
      (review) =>
        review.teacher?._id === teacher._id &&
        review.subject?._id === subject._id,
    );

    if (existingReview) {
      // Set evaluation points from existing review
      setEvaluation({
        courseContent: existingReview.courseContent || "",
        teachingMethod: existingReview.teachingMethod || "",
        communicationSkills: existingReview.communicationSkills || "",
        clarityOfExplanation: existingReview.clarityOfExplanation || "",
        engagementInteraction: existingReview.engagementInteraction || "",
        assignmentsPracticalWork: existingReview.assignmentsPracticalWork || "",
        overallSatisfaction: existingReview.overallSatisfaction || "",
      });
      setComment(existingReview.comment || "");
      setAdditionalComments(existingReview.additionalComments || "");
      setAnonymous(existingReview.anonymous || false);
    } else {
      // Reset form
      setEvaluation({
        courseContent: "",
        teachingMethod: "",
        communicationSkills: "",
        clarityOfExplanation: "",
        engagementInteraction: "",
        assignmentsPracticalWork: "",
        overallSatisfaction: "",
      });
      setComment("");
      setAdditionalComments("");
      setAnonymous(false);
    }

    setShowReviewModal(true);
  };

  const handleEvaluationChange = (field, value) => {
    setEvaluation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();

    try {
      if (submitting) return;

      // Validate all evaluation fields
      const requiredFields = [
        "courseContent",
        "teachingMethod",
        "communicationSkills",
        "clarityOfExplanation",
        "engagementInteraction",
        "assignmentsPracticalWork",
        "overallSatisfaction",
      ];

      const missingFields = requiredFields.filter(
        (field) => !evaluation[field],
      );

      if (missingFields.length > 0) {
        toast.error(
          `Please evaluate: ${missingFields
            .map((f) => f.replace(/([A-Z])/g, " $1").trim())
            .join(", ")}`,
        );
        return;
      }

      if (!comment.trim()) {
        toast.error("Please enter your main comment");
        return;
      }

      if (!selectedTeacher || !selectedTeacher._id) {
        toast.error("Teacher information is missing");
        return;
      }

      if (!selectedSubject || !selectedSubject._id) {
        toast.error("Subject information is missing");
        return;
      }

      setSubmitting(true);

      const reviewData = {
        teacherId: selectedTeacher._id,
        subjectId: selectedSubject._id,
        ...evaluation,
        comment: comment.trim(),
        additionalComments: additionalComments.trim(),
        anonymous,
      };

      console.log("Submitting enhanced review data:", reviewData);

      const existingReview = submittedReviews.find(
        (review) =>
          review.teacher?._id === selectedTeacher._id &&
          review.subject?._id === selectedSubject._id,
      );

      let response;
      if (existingReview) {
        // Update existing review
        response = await api.put(`/reviews/${existingReview._id}`, reviewData);
        toast.success("Review updated successfully");
      } else {
        // Submit new review
        response = await api.post("/reviews", reviewData);
        toast.success("Review submitted successfully");
      }

      console.log("API Response:", response.data);

      // Update local state
      await fetchSubmittedReviews();
      await fetchSubjects();

      setShowReviewModal(false);
      setEvaluation({
        courseContent: "",
        teachingMethod: "",
        communicationSkills: "",
        clarityOfExplanation: "",
        engagementInteraction: "",
        assignmentsPracticalWork: "",
        overallSatisfaction: "",
      });
      setComment("");
      setAdditionalComments("");
      setAnonymous(false);
    } catch (error) {
      console.error("Full error object:", error);

      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);

        const errorMessage =
          error.response.data?.message || "Failed to submit review";
        toast.error(errorMessage);

        if (error.response.status === 401) {
          localStorage.removeItem("userInfo");
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else if (error.response.status === 400) {
          if (error.response.data.errors) {
            error.response.data.errors.forEach((err) => toast.error(err));
          }
        }
      } else if (error.request) {
        console.log("No response received:", error.request);
        toast.error("No response from server. Please check your connection.");
      } else {
        console.log("Error setting up request:", error.message);
        toast.error("Error: " + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewStatus = (subjectId, teacherId) => {
    return submittedReviews.some(
      (review) =>
        review.subject?._id === subjectId && review.teacher?._id === teacherId,
    );
  };

  const renderEvaluationIndicator = (subjectId, teacherId) => {
    const review = submittedReviews.find(
      (r) => r.subject?._id === subjectId && r.teacher?._id === teacherId,
    );

    if (review) {
      const excellentCount = [
        review.courseContent,
        review.teachingMethod,
        review.communicationSkills,
        review.clarityOfExplanation,
        review.engagementInteraction,
        review.assignmentsPracticalWork,
        review.overallSatisfaction,
      ].filter((value) => value === "Excellent").length;

      const totalPoints = 7;
      const percentage = Math.round((excellentCount / totalPoints) * 100);

      return (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">
              {excellentCount}/7 Excellent
            </span>
            <span className="text-xs font-semibold text-green-600">
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${percentage}%` }}></div>
          </div>
          <span className="text-xs text-gray-500 mt-1">Reviewed</span>
        </div>
      );
    }
    return null;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReview(e);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          My <span className="text-blue-600">Subjects</span>
        </h1>
        <p className="text-gray-500 mt-2">
          View your enrolled subjects and provide detailed feedback
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-lg">No subjects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const hasReviewed = getReviewStatus(
              subject._id,
              subject.teacher?._id,
            );

            return (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <FaBook className="text-2xl text-white" />
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                    {subject.code}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {subject.name}
                </h3>

                <div className="space-y-2 text-sm mt-4">
                  <div className="flex items-center justify-between py-2 border-t border-blue-200">
                    <span className="text-gray-600">Teacher:</span>
                    <span className="font-semibold text-gray-800">
                      {subject.teacher?.name || "Not assigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-blue-200">
                    <span className="text-gray-600">Credits:</span>
                    <span className="font-semibold text-gray-800">
                      {subject.credits || 0}
                    </span>
                  </div>
                </div>

                {subject.description && (
                  <p className="mt-4 text-xs text-gray-700 italic bg-white bg-opacity-50 p-3 rounded-lg border border-blue-200">
                    {subject.description}
                  </p>
                )}

                {/* Review Section */}
                {subject.teacher && subject.teacher._id && (
                  <div className="mt-6 pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {hasReviewed
                            ? "Your Detailed Review"
                            : "Submit Detailed Review"}
                        </p>
                        {renderEvaluationIndicator(
                          subject._id,
                          subject.teacher._id,
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openReviewModal(subject.teacher, subject)
                        }
                        disabled={!subject.teacher?._id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          hasReviewed
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : subject.teacher?._id
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}>
                        {hasReviewed ? "Update Review" : "Submit Review"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Enhanced Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitReview}>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Detailed Teacher Evaluation
                </h3>
                <p className="text-gray-600 mb-6">
                  Evaluating{" "}
                  <span className="font-semibold">
                    {selectedTeacher?.name || "Unknown Teacher"}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold">
                    {selectedSubject?.name || "Unknown Subject"}
                  </span>
                </p>

                {/* Evaluation Points */}
                <div className="space-y-6">
                  {/* Course Content */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      1. Course Content
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange("courseContent", option)
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.courseContent === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teaching Method */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      2. Teaching Method
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange("teachingMethod", option)
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.teachingMethod === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Communication Skills */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      3. Communication Skills
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange(
                              "communicationSkills",
                              option,
                            )
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.communicationSkills === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clarity of Explanation */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      4. Clarity of Explanation
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange(
                              "clarityOfExplanation",
                              option,
                            )
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.clarityOfExplanation === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Engagement & Interaction */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      5. Engagement & Interaction
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange(
                              "engagementInteraction",
                              option,
                            )
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.engagementInteraction === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assignments & Practical Work */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      6. Assignments & Practical Work
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange(
                              "assignmentsPracticalWork",
                              option,
                            )
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.assignmentsPracticalWork === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overall Satisfaction */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      7. Overall Satisfaction
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Excellent", "Average", "Good"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleEvaluationChange(
                              "overallSatisfaction",
                              option,
                            )
                          }
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            evaluation.overallSatisfaction === option
                              ? option === "Excellent"
                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                : option === "Average"
                                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Comment */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      8. Overall Comments
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Provide your overall feedback about the teacher..."
                      maxLength="500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.length}/500 characters
                    </p>
                  </div>

                  {/* Additional Comments (Optional) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      9. Additional Comments (Optional)
                    </label>
                    <textarea
                      value={additionalComments}
                      onChange={(e) => setAdditionalComments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Any additional suggestions or comments..."
                      maxLength="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {additionalComments.length}/1000 characters
                    </p>
                  </div>

                  {/* Anonymous Option */}
                  <div className="mb-6 flex items-start">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label
                      htmlFor="anonymous"
                      className="ml-2 text-sm text-gray-700">
                      Submit anonymously (Admin will still see your identity for
                      internal purposes)
                    </label>
                  </div>

                  {/* Form Validation Summary */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-2">
                      <FaCheckCircle className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Evaluation Summary
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(evaluation).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              value ? "bg-green-500" : "bg-red-500"
                            }`}></span>
                          <span className="text-gray-600">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span
                            className={`ml-1 font-medium ${
                              value
                                ? value === "Excellent"
                                  ? "text-green-600"
                                  : value === "Average"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                : "text-red-500"
                            }`}>
                            {value || "Required"}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            comment.trim() ? "bg-green-500" : "bg-red-500"
                          }`}></span>
                        <span className="text-gray-600">Main Comment:</span>
                        <span
                          className={`ml-1 font-medium ${
                            comment.trim() ? "text-green-600" : "text-red-500"
                          }`}>
                          {comment.trim() ? "Completed" : "Required"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setEvaluation({
                        courseContent: "",
                        teachingMethod: "",
                        communicationSkills: "",
                        clarityOfExplanation: "",
                        engagementInteraction: "",
                        assignmentsPracticalWork: "",
                        overallSatisfaction: "",
                      });
                      setComment("");
                      setAdditionalComments("");
                      setAnonymous(false);
                    }}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      Object.values(evaluation).some((v) => !v) ||
                      !comment.trim()
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaStar className="text-sm" />
                        {Object.values(evaluation).some((v) => !v) ||
                        !comment.trim()
                          ? "Complete All Fields"
                          : "Submit Detailed Review"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MySubjects;
