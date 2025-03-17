import React, { createContext, useContext } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

// Fix: Correct context creation
const UserContext = createContext();

// Fix: Use the correct API URL
const API_URL = import.meta.env.VITE_API_URL;

// User Context Provider Component
export const UserProvider = ({ children }) => {

  // Function to handle user login
  // Fix: Use the correct API URL and handle success
  const loginUser = async ({ email, name }) => {
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, name },
        { withCredentials: true });
  
      if (response.status === 200) {
        toast.success("Login successful!");
        console.log(response.data)
      }
      return response.status;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Invalid credentials. Please try again.");
      } else if (error.response && error.response.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      // Handle other errors
      console.error("Login failed:", error);
    }
  };
  
  // Fetch all breeds
  const fetchBreeds = async () => {
    try {
      const response = await axios.get(`${API_URL}/dogs/breeds`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error("Error fetching breeds:", error);
      throw new Error("Failed to fetch breeds");
    }
  };

  // Fetch dog IDs based on filters
  const fetchDogIDs = async ({ queryKey }) => {
    if (!Array.isArray(queryKey) || queryKey.length < 2) {
      throw new Error("Invalid queryKey format for fetchDogIDs");
    }

    const [_key, filters] = queryKey; // Destructure the filters from queryKey
    if (!filters || typeof filters !== "object") {
      throw new Error("Filters missing or incorrect in queryKey");
    }

    const { breeds, zipCodes, ageMin, ageMax, page, sort } = filters;
    try {
      const response = await axios.get(`${API_URL}/dogs/search`, {
        params: {
          breeds: breeds.length ? breeds : undefined,
          zipCodes: zipCodes?.length ? zipCodes : undefined,
          ageMin: ageMin || 0,
          ageMax: ageMax || undefined,
          size: 12, 
          from: (page - 1) * 12, 
          sort: sort ? `${sort.field}:${sort.direction}` : undefined,
        },
        
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching dog IDs:", error);
      throw new Error("Failed to fetch dog IDs");
    }
  };

  // Fetch full dog data from IDs
  const fetchDogs = async (dogIds) => {
    try {
      const response = await axios.post(`${API_URL}/dogs`, dogIds, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error("Error fetching dog data:", error);
      throw new Error("Failed to fetch dog data");
    }
  };

  // Fetch location data (ZIP codes, city, etc.)
  const fetchLocations = async ({ city, states, geoBoundingBox }) => {
    try {
      const requestBody = {};
      if (city) requestBody.city = city;
      if (states.length) requestBody.states = states;
      if (geoBoundingBox) requestBody.geoBoundingBox = geoBoundingBox;

      const response = await axios.post(
        `${API_URL}/locations/search`,
        { ...requestBody, size: 25 }, 
        { withCredentials: true }
      );

      if (!response.data || !response.data.results) {
        console.error("No location data received:");
        throw new Error("No location data received.");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching locations:", error);
      return { results: [], total: 0 }; 
    }
  };

  // Match dogs from favorites
  const matchDogs = async (dogIds) => {
    try {
      const matchResponse = await axios.post(`${API_URL}/dogs/match`, dogIds, {
        withCredentials: true,
      });

      const matchedDogId = matchResponse.data.match; 

      if (!matchedDogId) {
        throw new Error("No match found.");
      }

      // Fetch full details of the matched dog
      const dogDetailsResponse = await axios.post(
        `${API_URL}/dogs`,
        [matchedDogId],
        { withCredentials: true }
      );

      return dogDetailsResponse.data[0]; 
    } catch (error) {
      console.error("Error in matchDogs:", error);
      throw new Error("Failed to find a match.");
    }
  };


  return (
    // Proveider to pass down the functions to componenets that need them
    <UserContext.Provider
      value={{
        fetchBreeds,
        fetchDogIDs,
        fetchDogs,
        fetchLocations,
        matchDogs,
        loginUser, 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook to use the User Context
export const useUserContext = () => {
  return useContext(UserContext);
};

// Prop Types
UserProvider.propTypes = {
  children: PropTypes.node.isRequired
};
