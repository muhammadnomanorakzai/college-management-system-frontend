import React, { useState, useEffect } from "react";
import api from "../../utils/axiosConfig";
import { motion } from "framer-motion";
import {
  FaStar,
  FaFilter,
  FaChartBar,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBook,
  FaSearch,
  FaEye,
  FaTimes,
  FaDownload,
  FaSync,
  FaChevronDown,
  FaChevronUp,
  FaChartPie,
  FaCheckCircle,
  FaExclamationTriangle,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [filterRating, setFilterRating] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedEvaluation, setExpandedEvaluation] = useState(false);
  const [evaluationFilter, setEvaluationFilter] = useState("all");
  const [showEvaluationChart, setShowEvaluationChart] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchTeachers();
  }, [selectedTeacher, filterRating, dateFilter, evaluationFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log("👑 Admin fetching enhanced reviews...");

      let url = "/reviews";
      if (selectedTeacher !== "all") {
        url = `/reviews/teacher/${selectedTeacher}`;
      }

      console.log("API URL:", url);
      const { data } = await api.get(url);

      if (!data || !data.success) {
        toast.error(data?.message || "Failed to fetch reviews");
        setReviews([]);
        setStats(null);
        return;
      }

      let filteredReviews = data.data || [];

      // Apply rating filter
      if (filterRating !== "all") {
        filteredReviews = filteredReviews.filter(
          (review) => review.rating === parseInt(filterRating),
        );
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        let dateLimit = new Date();

        if (dateFilter === "week") dateLimit.setDate(now.getDate() - 7);
        else if (dateFilter === "month") dateLimit.setDate(now.getDate() - 30);
        else if (dateFilter === "3months")
          dateLimit.setDate(now.getDate() - 90);

        filteredReviews = filteredReviews.filter(
          (review) => new Date(review.createdAt) >= dateLimit,
        );
      }

      // Apply evaluation filter
      if (evaluationFilter !== "all") {
        filteredReviews = filteredReviews.filter(
          (review) =>
            review.overallSatisfaction === evaluationFilter ||
            review.courseContent === evaluationFilter ||
            review.teachingMethod === evaluationFilter,
        );
      }

      // Apply search filter
      if (searchTerm) {
        filteredReviews = filteredReviews.filter(
          (review) =>
            review.teacher?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            review.subject?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.student?.name &&
              !review.anonymous &&
              review.student.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())),
        );
      }

      setReviews(filteredReviews);

      // Use enhanced stats from API or calculate locally
      if (data.stats && data.stats.evaluationBreakdown) {
        setStats(data.stats);
      } else {
        // Calculate enhanced stats locally
        const calculatedStats = calculateEnhancedStats(filteredReviews);
        setStats(calculatedStats);
      }

      console.log("✅ Enhanced reviews loaded:", filteredReviews.length);
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else {
        toast.error("Failed to load reviews");
      }

      setReviews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateEnhancedStats = (reviews) => {
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        evaluationBreakdown: {},
        summaryMetrics: {},
      };
    }

    const evaluationPoints = [
      "courseContent",
      "teachingMethod",
      "communicationSkills",
      "clarityOfExplanation",
      "engagementInteraction",
      "assignmentsPracticalWork",
      "overallSatisfaction",
    ];

    const stats = {
      totalReviews: reviews.length,
      averageRating:
        reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length,
      byRating: {
        1: reviews.filter((r) => r.rating === 1).length,
        2: reviews.filter((r) => r.rating === 2).length,
        3: reviews.filter((r) => r.rating === 3).length,
        4: reviews.filter((r) => r.rating === 4).length,
        5: reviews.filter((r) => r.rating === 5).length,
      },
      evaluationBreakdown: {},
      summaryMetrics: {
        overallExcellent: 0,
        overallAverage: 0,
        overallGood: 0,
        averageScore: 0,
      },
    };

    // Calculate breakdown for each evaluation point
    evaluationPoints.forEach((point) => {
      const values = reviews.map((r) => r[point]).filter(Boolean);
      const total = values.length;

      if (total === 0) {
        stats.evaluationBreakdown[point] = {
          Excellent: 0,
          Average: 0,
          Good: 0,
          percentages: { Excellent: 0, Average: 0, Good: 0 },
        };
        return;
      }

      const excellent = values.filter((v) => v === "Excellent").length;
      const average = values.filter((v) => v === "Average").length;
      const Good = values.filter((v) => v === "Good").length;

      stats.evaluationBreakdown[point] = {
        Excellent: excellent,
        Average: average,
        Good: Good,
        percentages: {
          Excellent: (excellent / total) * 100,
          Average: (average / total) * 100,
          Good: (Good / total) * 100,
        },
      };
    });

    // Calculate summary metrics
    const overallSatisfaction = stats.evaluationBreakdown.overallSatisfaction;
    if (overallSatisfaction) {
      stats.summaryMetrics.overallExcellent =
        overallSatisfaction.percentages.Excellent;
      stats.summaryMetrics.overallAverage =
        overallSatisfaction.percentages.Average;
      stats.summaryMetrics.overallGood = overallSatisfaction.percentages.Good;

      // Calculate average score (Excellent=3, Average=2, Good=1)
      const scores = reviews.map((review) => {
        const mapping = { Excellent: 3, Average: 2, Good: 1 };
        return mapping[review.overallSatisfaction] || 0;
      });
      stats.summaryMetrics.averageScore =
        scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return stats;
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get("/teachers");
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-lg ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-gray-700">
          {rating}.0
        </span>
      </div>
    );
  };

  const renderEvaluationGoodge = (value) => {
    const config = {
      Excellent: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: FaCheckCircle,
      },
      Average: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: FaChartBar,
      },
      Good: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: FaExclamationTriangle,
      },
    };

    const GoodgeConfig = config[value] || config.Average;
    const Icon = GoodgeConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${GoodgeConfig.color}`}>
        <Icon className="text-xs" />
        {value}
      </span>
    );
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowReviewDetail(true);
  };

  const exportReviews = () => {
    if (reviews.length === 0) {
      toast.warning("No reviews to export");
      return;
    }

    const csvContent = [
      [
        "Teacher",
        "Subject",
        "Student",
        "Overall Rating",
        "Course Content",
        "Teaching Method",
        "Communication Skills",
        "Clarity of Explanation",
        "Engagement & Interaction",
        "Assignments & Practical Work",
        "Overall Satisfaction",
        "Main Comment",
        "Additional Comments",
        "Date",
        "Anonymous",
      ],
      ...reviews.map((review) => [
        review.teacher?.name || "N/A",
        review.subject?.name || "N/A",
        review.anonymous ? "Anonymous" : review.student?.name || "N/A",
        review.rating,
        review.courseContent || "N/A",
        review.teachingMethod || "N/A",
        review.communicationSkills || "N/A",
        review.clarityOfExplanation || "N/A",
        review.engagementInteraction || "N/A",
        review.assignmentsPracticalWork || "N/A",
        review.overallSatisfaction || "N/A",
        `"${review.comment.replace(/"/g, '""')}"`,
        review.additionalComments
          ? `"${review.additionalComments.replace(/"/g, '""')}"`
          : "",
        new Date(review.createdAt).toLocaleDateString(),
        review.anonymous ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher-evaluations-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${reviews.length} detailed evaluations`);
  };

  const handleRefresh = () => {
    fetchReviews();
    fetchTeachers();
  };

  const handleResetFilters = () => {
    setSelectedTeacher("all");
    setFilterRating("all");
    setDateFilter("all");
    setEvaluationFilter("all");
    setSearchTerm("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const ratingColors = {
    1: "bg-red-100 text-red-800 border-red-200",
    2: "bg-orange-100 text-orange-800 border-orange-200",
    3: "bg-yellow-100 text-yellow-800 border-yellow-200",
    4: "bg-blue-100 text-blue-800 border-blue-200",
    5: "bg-green-100 text-green-800 border-green-200",
  };

  const evaluationColors = {
    Excellent: "bg-green-500",
    Average: "bg-yellow-500",
    Good: "bg-red-500",
  };

  const formatEvaluationPoint = (point) => {
    return point
      .replace(/([A-Z])/g, " $1")
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/&/g, " & ");
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enhanced evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              Teacher <span className="text-blue-600">Evaluations</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor detailed teacher performance metrics and student feedback
            </p>
            <p className="text-sm text-gray-400 mt-1">👑 Admin Access Only</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              <FaSync className="text-sm" />
              Refresh
            </button>
            <button
              onClick={() => setShowEvaluationChart(!showEvaluationChart)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <FaChartPie className="text-sm" />
              {showEvaluationChart ? "Hide Charts" : "Show Charts"}
            </button>
            <button
              onClick={exportReviews}
              disabled={reviews.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <FaDownload className="text-sm" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <motion.div
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Evaluations
                </p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.totalReviews || 0}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FaChartBar className="text-2xl" />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Score
                </p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.summaryMetrics?.averageScore
                    ? stats.summaryMetrics.averageScore.toFixed(1)
                    : "0.0"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Out of 3.0</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <FaThumbsUp className="text-2xl" />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Excellent Ratings
                </p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.summaryMetrics?.overallExcellent
                    ? Math.round(stats.summaryMetrics.overallExcellent)
                    : 0}
                  %
                </h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <FaStar className="text-2xl" />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Needs Improvement
                </p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.summaryMetrics?.overallGood
                    ? Math.round(stats.summaryMetrics.overallGood)
                    : 0}
                  %
                </h3>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <FaExclamationTriangle className="text-2xl" />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Teachers Reviewed
                </p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {teachers.length}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FaChalkboardTeacher className="text-2xl" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Enhanced Evaluation Charts */}
        {showEvaluationChart && stats?.evaluationBreakdown && (
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              Detailed Evaluation Metrics
            </h2>
            <div className="space-y-6">
              {Object.entries(stats.evaluationBreakdown).map(([key, data]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-700">
                        {formatEvaluationPoint(key)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {data.Excellent + data.Average + data.Good} responses
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {data.percentages.Excellent > 50 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <FaCheckCircle className="text-xs" />
                          Strong
                        </span>
                      )}
                      {data.percentages.Good > 30 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          <FaExclamationTriangle className="text-xs" />
                          Needs Attention
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                    <div
                      className="h-4 bg-green-500 transition-all duration-500"
                      style={{ width: `${data.percentages.Excellent}%` }}
                      title={`Excellent: ${data.percentages.Excellent.toFixed(1)}%`}></div>
                    <div
                      className="h-4 bg-yellow-500 transition-all duration-500"
                      style={{ width: `${data.percentages.Average}%` }}
                      title={`Average: ${data.percentages.Average.toFixed(1)}%`}></div>
                    <div
                      className="h-4 bg-red-500 transition-all duration-500"
                      style={{ width: `${data.percentages.Good}%` }}
                      title={`Good: ${data.percentages.Good.toFixed(1)}%`}></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>
                        Excellent: {data.Excellent} (
                        {data.percentages.Excellent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>
                        Average: {data.Average} (
                        {data.percentages.Average.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>
                        Good: {data.Good} ({data.percentages.Good.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              Filters & Search
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Reset Filters
              </button>
              <button
                onClick={fetchReviews}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchReviews()}
                placeholder="Search evaluations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Teacher Filter */}
            <div>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Evaluation Filter */}
            <div>
              <select
                value={evaluationFilter}
                onChange={(e) => setEvaluationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Evaluations</option>
                <option value="Excellent">Excellent Only</option>
                <option value="Average">Average Only</option>
                <option value="Good">Needs Improvement</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reviews List */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              Detailed Evaluations ({reviews.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedEvaluation(!expandedEvaluation)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {expandedEvaluation ? (
                  <>
                    <FaChevronUp className="text-xs" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <FaChevronDown className="text-xs" />
                    Show Details
                  </>
                )}
              </button>
              <span className="text-sm text-gray-500">
                {loading ? "Loading..." : "Ready"}
              </span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <FaBook className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No evaluations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedTeacher !== "all"
                  ? `No evaluations for selected teacher. Try selecting "All Teachers".`
                  : "No evaluations in the system yet. Ask students to submit feedback."}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Left Column - Teacher & Subject Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <FaChalkboardTeacher className="text-xl text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">
                            {review.teacher?.name || "Unknown Teacher"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm">
                              <FaBook className="text-xs" />
                              {review.subject?.name || "Unknown Subject"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {review.subject?.code || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Rating & Evaluation Summary */}
                      <div className="ml-16 space-y-4">
                        {/* Overall Rating */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-700">
                              Overall Rating:
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <div className="text-sm">
                            {renderEvaluationGoodge(review.overallSatisfaction)}
                          </div>
                        </div>

                        {/* Evaluation Points Grid */}
                        {expandedEvaluation && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            {[
                              { key: "courseContent", label: "Course Content" },
                              {
                                key: "teachingMethod",
                                label: "Teaching Method",
                              },
                              {
                                key: "communicationSkills",
                                label: "Communication",
                              },
                              { key: "clarityOfExplanation", label: "Clarity" },
                              {
                                key: "engagementInteraction",
                                label: "Engagement",
                              },
                              {
                                key: "assignmentsPracticalWork",
                                label: "Assignments",
                              },
                            ].map((item) => (
                              <div key={item.key} className="flex flex-col">
                                <span className="text-xs text-gray-500 mb-1">
                                  {item.label}
                                </span>
                                <div>
                                  {renderEvaluationGoodge(review[item.key])}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Main Comment */}
                        <div>
                          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            "{review.comment}"
                          </p>
                          {review.additionalComments && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">
                                  Additional Comments:
                                </span>{" "}
                                {review.additionalComments}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Student Info & Actions */}
                    <div className="md:w-64">
                      <div className="space-y-4">
                        {/* Student Info */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FaUserGraduate className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Student Information
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p
                              className={
                                review.anonymous ? "italic" : "font-semibold"
                              }>
                              {review.anonymous
                                ? "Anonymous Student"
                                : review.student?.name || "N/A"}
                            </p>
                            {!review.anonymous &&
                              review.student?.rollNumber && (
                                <p className="text-gray-500 mt-1">
                                  Roll No: {review.student.rollNumber}
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Review Metadata */}
                        <div className="space-y-2">
                          <div
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              ratingColors[review.rating] ||
                              "bg-gray-100 text-gray-800"
                            }`}>
                            {review.rating} Star{review.rating !== 1 ? "s" : ""}
                          </div>
                          <p className="text-xs text-gray-500">
                            Submitted on{" "}
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleViewReview(review)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          <FaEye className="text-sm" />
                          View Full Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Rating Distribution Chart */}
        {/* {stats?.byRating && reviews.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              Rating Distribution
            </h2>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((ratingValue) => {
                const count = stats.byRating[ratingValue] || 0;
                const percentage =
                  stats.totalReviews > 0
                    ? ((count / stats.totalReviews) * 100).toFixed(1)
                    : 0;

                return (
                  <div key={ratingValue} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {renderStars(ratingValue)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {count} review{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ratingColors[ratingValue]?.split(" ")[0] ||
                          "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )} */}
      </motion.div>

      {/* Enhanced Review Detail Modal */}
      {showReviewDetail && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Detailed Evaluation
                </h3>
                <button
                  onClick={() => setShowReviewDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Teacher & Subject Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FaChalkboardTeacher className="text-2xl text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">
                        {selectedReview.teacher?.name || "Unknown Teacher"}
                      </h4>
                      <p className="text-gray-600">
                        {selectedReview.teacher?.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <FaBook className="text-2xl text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {selectedReview.subject?.name || "Unknown Subject"}
                      </h4>
                      <p className="text-gray-600">
                        Code: {selectedReview.subject?.code || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      Overall Rating
                    </span>
                    <div
                      className={`px-3 py-1 rounded-full ${
                        ratingColors[selectedReview.rating]
                      }`}>
                      {selectedReview.rating} Star
                      {selectedReview.rating !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex justify-center my-4">
                    {renderStars(selectedReview.rating)}
                  </div>
                  <div className="flex justify-center mt-2">
                    {renderEvaluationGoodge(selectedReview.overallSatisfaction)}
                  </div>
                </div>

                {/* Detailed Evaluation Points */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-bold text-gray-800 mb-4 text-lg">
                    Evaluation Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "courseContent", label: "Course Content" },
                      { key: "teachingMethod", label: "Teaching Method" },
                      {
                        key: "communicationSkills",
                        label: "Communication Skills",
                      },
                      {
                        key: "clarityOfExplanation",
                        label: "Clarity of Explanation",
                      },
                      {
                        key: "engagementInteraction",
                        label: "Engagement & Interaction",
                      },
                      {
                        key: "assignmentsPracticalWork",
                        label: "Assignments & Practical Work",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="font-medium text-gray-700">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {renderEvaluationGoodge(selectedReview[item.key])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Main Feedback
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-gray-700">
                        "{selectedReview.comment}"
                      </p>
                    </div>
                  </div>

                  {selectedReview.additionalComments && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Additional Comments
                      </h4>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <p className="text-gray-700">
                          {selectedReview.additionalComments}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Student Info */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUserGraduate className="text-gray-500" />
                    <h4 className="font-medium text-gray-700">
                      Reviewer Information
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-600">Name:</span>{" "}
                      <span
                        className={
                          selectedReview.anonymous ? "italic" : "font-semibold"
                        }>
                        {selectedReview.anonymous
                          ? "Anonymous Student"
                          : selectedReview.student?.name || "N/A"}
                      </span>
                    </p>
                    {!selectedReview.anonymous &&
                      selectedReview.student?.rollNumber && (
                        <p>
                          <span className="text-gray-600">Roll Number:</span>{" "}
                          <span className="font-semibold">
                            {selectedReview.student.rollNumber}
                          </span>
                        </p>
                      )}
                    <p>
                      <span className="text-gray-600">Submitted:</span>{" "}
                      {new Date(selectedReview.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                    <p>
                      <span className="text-gray-600">Status:</span>{" "}
                      <span className="text-green-600 font-medium">
                        ✓ Visible to Admin
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowReviewDetail(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
