import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaFilter, FaChartBar } from "react-icons/fa";
import { motion } from "framer-motion";

const PrincipalReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchTeachers();
  }, []);

  const fetchReviews = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const url =
        selectedTeacher === "all"
          ? `${import.meta.env.VITE_API_URL}/reviews`
          : `${
              import.meta.env.VITE_API_URL
            }/reviews/teacher/${selectedTeacher}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });

      setReviews(data.data || []);
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/teachers`,
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-sm ${
              star <= rating ? "text-yellow-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-10">Loading reviews...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Teacher Reviews</h1>
        <p className="text-gray-600">
          Monitor and evaluate teacher performance
        </p>
      </div>

      {/* Statistics Card */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalReviews}
                </p>
              </div>
              <FaChartBar className="text-2xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border">
            <div>
              <p className="text-gray-500 text-sm">Average Rating</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
              </p>
            </div>
          </div>
          {/* Add more stat cards as needed */}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow border">
        <div className="flex items-center space-x-4">
          <FaFilter className="text-gray-500" />
          <select
            value={selectedTeacher}
            onChange={(e) => {
              setSelectedTeacher(e.target.value);
              fetchReviews();
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No reviews found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {review.teacher?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Subject: {review.subject?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-gray-700">{review.comment}</p>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>
                    <span>By: </span>
                    <span
                      className={review.anonymous ? "italic" : "font-medium"}>
                      {review.anonymous
                        ? "Anonymous Student"
                        : review.student?.name}
                    </span>
                    {!review.anonymous && (
                      <span className="ml-2">
                        ({review.student?.rollNumber})
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalReviews;
