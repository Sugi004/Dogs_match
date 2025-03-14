import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Slider,
  Pagination,
  TextField,
  IconButton,
  Grid2,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useNavigate } from "react-router-dom";



// Fetch all breeds
const fetchBreeds = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/dogs/breeds`, {
      withCredentials: true, 
     
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching breeds:", error);
    throw new Error("Failed to fetch breeds");
  }
};

// Fetch dog IDs based on search criteria
const fetchDogIDs = async ({ queryKey }) => {
  
    // Fix: Ensure correct destructuring
    if (!Array.isArray(queryKey) || queryKey.length < 2) {
      throw new Error("Invalid queryKey format for fetchDogIDs");
    }

    const [_key, filters] = queryKey; // Extracting filters object

    if (!filters || typeof filters !== "object") {
      throw new Error("Filters missing or incorrect in queryKey");
    }


    const { breeds, zipCodes, ageMin, ageMax, page, sort } = filters;
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/dogs/search`, {
      params: {
        breeds: breeds.length ? breeds : undefined,
        zipCodes: zipCodes?.length ? zipCodes : undefined,
        ageMin: ageMin || 0,
        ageMax: ageMax || undefined,
        size: 12, // Limit to 12 results per page
        from: (page - 1) * 12, // Cursor-based pagination
        sort: sort ? `${sort.field}:${sort.direction}` : undefined, // Apply sorting
      },
      withCredentials: true, // Include credentials in the request
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
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/dogs`, dogIds, {
      withCredentials: true, // Include credentials in the request
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching dog data:", error);
    throw new Error("Failed to fetch dog data");
  }
};



// Fetch location data for ZIP codes or other location parameters
const fetchLocations = async ({ city, states, geoBoundingBox }) => {
  try {
    // Construct request body dynamically (exclude undefined fields)
    const requestBody = {};
    if (city) requestBody.city = city;
    if (states.length) requestBody.states = states;
    if (geoBoundingBox) requestBody.geoBoundingBox = geoBoundingBox;

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/locations/search`,
      { ...requestBody, size: 25 }, // Limit results
      { withCredentials: true }
    );

    if (!response.data || !response.data.results) {
      throw new Error("No location data received.");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return { results: [], total: 0 }; // Return empty result set instead of throwing an error
  }
};


// Match dogs from favorites
const matchDogs = async (dogIds) => {
  try {
    const matchResponse = await axios.post(
      `${import.meta.env.VITE_API_URL}/dogs/match`, 
      dogIds, 
      { withCredentials: true }
    );

    const matchedDogId = matchResponse.data.match; // Get matched dog ID

    if (!matchedDogId) {
      throw new Error("No match found.");
    }

    // Now fetch full details of this dog
    const dogDetailsResponse = await axios.post(
      `${import.meta.env.VITE_API_URL}/dogs`, 
      [matchedDogId], 
      { withCredentials: true }
    );

    return dogDetailsResponse.data[0]; // Get the full dog object
  } catch (error) {
    console.error("Error in matchDogs:", error);
    throw new Error("Failed to find a match.");
  }
};


const getCookie = (name) => {
  const value = `${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  console.log("Cookie value:", value);

  console.log("Cookie parts:", parts);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};




const DogsLayout = () => {
  const [breeds, setBreeds] = useState([]);
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  
  const [city, setCity] = useState("");
  const [states, setStates] = useState([]);
  const [geoBoundingBox, setGeoBoundingBox] = useState(null); // Optional bounding box for location
  const [ageRange, setAgeRange] = useState([0, 20]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ field: "breed", direction: "asc" });
  const [favorites, setFavorites] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedZipCodes, setSelectedZipCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate() // Store full dog objects


  useEffect(() => {
    const token = getCookie('fetch-access-token');
    // if (!token) {
    //   // Redirect to the login page if token is not found
    //   navigate('/login');
    // }

    console.log(token);
  }, [navigate]);


  const clearToken = () => {
    document.cookie = 'fetch-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  };

  // Fetch breed list
  const { data: breedList } = useQuery(["breeds"], fetchBreeds, {
    onSuccess: (data) => setBreeds(data),
    onError: (error) => console.error("Failed to fetch breeds:", error.message),
  });


  const { data: searchResults, isLoading: isSearching } = useQuery(
    ["dogs", {
      breeds: selectedBreeds,
      zipCodes: selectedZipCodes && selectedZipCodes.length > 0 ? selectedZipCodes : undefined,
      ageMin: ageRange[0],
      ageMax: ageRange[1],
      page,
      sort,
    }],
    fetchDogIDs,
    
    {
      retry: false,
      onError: (error) => console.error("Failed to fetch dog IDs:", error.message),
      onSuccess: (data) => {
        if (data && data.resultIds.length === 0) {
          return isSearching
        }
      }
    }
  );

  // Fetch full dog data based on search results, ensuring it's enabled correctly
  const { data: dogs, isLoading: isFetchingDogs } = useQuery(
    ["dogData", searchResults?.resultIds], // Only fetch if resultIds are available
    () => fetchDogs(searchResults?.resultIds), // Fetch dogs with the retrieved dog IDs
    {
      // enabled: true,
      enabled: !!searchResults?.resultIds && searchResults.resultIds.length > 0,
      retry: false,
      staleTime: 3,
      onError: (error) => console.error("Failed to fetch dog data:", error.message),
      onSuccess: (data) => {
        if (data){
          console.log(data.resultIds);
        }
      }
      
    }
  );

  const matchMutation = useMutation(matchDogs, {
    onSuccess: (matchedDog) => {
      setMatchResult(matchedDog); // Store the full matched dog object
    },
    onError: (error) => console.error("Failed to fetch matched dog details:", error.message),
  });

  const toggleFavorite = (dogId) => {
    setFavorites((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  const handleSortFieldChange = (e) => {
    setSort((prev) => ({ ...prev, field: e.target.value }));
  };

  const handleSortDirectionChange = (e) => {
    setSort((prev) => ({ ...prev, direction: e.target.value }));
  };

  

  const handleLocationSearch = async () => {
    if (!city && states.length === 0) {
      console.error("Please enter a city or state.");
      return;
    }
  
    setLoading(true);
    
    // Fetch locations based on user input
    try {
      const locationData = await fetchLocations({ city, states });
  
    if (!locationData.results || locationData.results.length === 0) {
      console.error("No locations found.");
      setLoading(false);
      return;
    }
  
    // Extract ZIP codes from the response
    const zipCodes = locationData.results.map((location) => location.zip_code);
  
    if (zipCodes.length === 0) {
      console.error("No ZIP codes found for the given location.");
      setLoading(false);
      return;
    }
  
    // Set ZIP codes and trigger dog search
    setSelectedZipCodes(zipCodes);
   
    setLoading(false);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLoading(false);
    }
  };

  const clearFilters = () => {
    // Reset all filter-related states
    setSelectedBreeds([]); // Reset selected breeds
    setAgeRange([0, 20]); // Reset age range (assuming default is 0-20)
    setSelectedZipCodes([]); // Reset selected zip codes (empty for no filter)
    setSort({ field: 'breed', direction: 'asc' }); // Reset sort to default (breed: ascending)
    setPage(1); // Reset page to the first page
   
  };
  
  

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Browse Available Dogs
      </Typography>

      <Button
        variant="outlined"
        onClick={() => {
          clearToken(); // Clear the cookie
          navigate('/login'); // Redirect to the login page
        }}
        sx={{ mt: 2 }}
      >
        Logout
      </Button>

      {/* Filters */}
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Breed</InputLabel>
            <Select
              multiple
              value={selectedBreeds}
              onChange={(e) => setSelectedBreeds(e.target.value)}
            >
              {breedList?.map((breed) => (
                <MenuItem key={breed} value={breed}>
                  {breed}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Typography>Age Range</Typography>
          <Slider
            value={ageRange}
            onChange={(_, newValue) => setAgeRange(newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={20}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
            <TextField
              label="Enter City"
              variant="outlined"
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Enter State (e.g., CA, TX)"
              variant="outlined"
              fullWidth
              value={states.join(", ")}
              onChange={(e) => setStates(e.target.value.split(",").map((s) => s.trim().toUpperCase()))}
            />
          </Grid>

          <Grid item xs={12} sm={6} display="flex" alignItems="center" justifyContent="center">
            <Button variant="contained" color="primary" onClick={handleLocationSearch}>
              Search Location
            </Button>
          </Grid>          


        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
           
            <Select 
            value={sort.field} onChange={handleSortFieldChange}>
              <MenuItem value="breed">Breed</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="age">Age</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Sort Direction</InputLabel>
            <Select value={sort.direction} onChange={handleSortDirectionChange}>
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid item xs={12}>
    <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
      Clear Filters
    </Button>
  </Grid>

      {/* Dog Cards Grid */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {isSearching && isFetchingDogs ? (
          <Typography>Loading dogs...</Typography>
        ) : dogs && dogs.length>0? (
          dogs?.map((dog) => (
            <Grid item xs={12} sm={6} md={4} key={dog.id}>
              <Card>
                <CardMedia component="img" height="200" image={dog.img} alt={dog.name} />
                <CardContent>
                  <Typography variant="h6">{dog.name}</Typography>
                  <Typography variant="body2">Breed: {dog.breed}</Typography>
                  <Typography variant="body2">Age: {dog.age} years</Typography>
                  <Typography variant="body2">Zip Code: {dog.zip_code}</Typography>
                  <Button onClick={() => toggleFavorite(dog.id)}>
                    <FavoriteIcon color={favorites.includes(dog.id) ? "error" : "disabled"} />
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))): (
            <Typography variant="h6" sx={{ textAlign: "center", width: "100%", mt: 2 }}>
              No dogs found for the selected Location.
            </Typography>
          )}

      </Grid>

      <Pagination
        count={Math.ceil((searchResults?.total || 1) / 12)}
        page={page}
        onChange={handlePageChange}
        sx={{ display: "flex", justifyContent: "center", mt: 4 }}
      />

      <Grid2 container spacing={2} justifyContent="center" alignItems="center">
      <Button
        variant="contained"
        color="primary"
        onClick={() =>  matchMutation.mutate(favorites)}
        disabled={favorites.length === 0 || matchMutation.isLoading}
        
        sx={{ mt: 4, display: "flex", alignItems: "center", justifyContent: "center" }} 
        startIcon={<FavoriteIcon />}
      >
        Find My Match
      </Button>
      </Grid2>

      {matchResult && (
      <Grid container spacing={3} sx={{ mt: 4 }} justifyContent="center">
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardMedia component="img" height="200" image={matchResult.img} alt={matchResult.name} />
            <CardContent>
              <Typography variant="h6">{matchResult.name}</Typography>
              <Typography variant="body2">Breed: {matchResult.breed}</Typography>
              <Typography variant="body2">Age: {matchResult.age} years</Typography>
              <Typography variant="body2">Zip Code: {matchResult.zip_code}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )}

    </Container>
  );
};

export default DogsLayout;
