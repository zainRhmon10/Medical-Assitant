import React, { createContext, useContext, useState, useEffect } from "react";
import { getDoctorProfile, updateDoctorProfile, updateDoctorProfileImage } from "../services/profileApi";
import { getSpecialties } from "../../auth/services/authApi";

const DoctorProfileContext = createContext(null);

const extractProfileData = (response) => {
  return response?.data?.profile_info || 
         response?.data?.data || 
         response?.data?.doctor || 
         response?.data?.profile || 
         response?.data?.user || 
         response?.data || 
         null;
};

export const DoctorProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDoctorProfile();
      console.log("PROFILE API FULL RESPONSE:", response);
      console.log("PROFILE API DATA:", response?.data);
      
      const data = extractProfileData(response);
                   
      console.log("EXTRACTED PROFILE DATA:", data);
      setProfile(data);
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    setIsLoadingSpecialties(true);
    try {
      const response = await getSpecialties();
      const data = Array.isArray(response?.data) ? response.data : [];
      setSpecialties(data);
    } catch (err) {
      console.error("Error fetching specialties:", err);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSpecialties();
  }, []);

  const updateProfile = async (profileData) => {
    try {
      const response = await updateDoctorProfile(profileData);
      const updatedData = extractProfileData(response);
      setProfile(updatedData);
      return updatedData;
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  const updateImage = async (file) => {
    try {
      const response = await updateDoctorProfileImage(file);
      const responseData = extractProfileData(response);
      
      // Update image path in the profile state
      const img = responseData?.image || responseData?.image_path;
      if (responseData && img) {
        setProfile((prev) => (prev ? { ...prev, image: img } : null));
      } else {
        // Fallback: refetch profile to be safe
        await fetchProfile();
      }
      return responseData;
    } catch (err) {
      console.error("Error updating profile image:", err);
      throw err;
    }
  };

  return (
    <DoctorProfileContext.Provider
      value={{
        profile,
        specialties,
        isLoading,
        isLoadingSpecialties,
        error,
        refetchProfile: fetchProfile,
        updateProfile,
        updateImage,
      }}
    >
      {children}
    </DoctorProfileContext.Provider>
  );
};

export const useDoctorProfile = () => {
  const context = useContext(DoctorProfileContext);
  if (!context) {
    throw new Error("useDoctorProfile must be used within a DoctorProfileProvider");
  }
  return context;
};
