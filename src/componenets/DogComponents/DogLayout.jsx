import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {toast, ToastContainer} from "react-toastify";
import {useUserContext} from "../../Context/UserContext";
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
  Divider
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useNavigate } from "react-router-dom";


const DogsLayout = () => {

  // Import fetch functions from user context
  const {fetchBreeds,
    fetchDogIDs,
    fetchDogs,
    fetchLocations,
    matchDogs,} = useUserContext();

  // State variables for search and filter criteria
  const [breeds, setBreeds] = useState([]);
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [city, setCity] = useState("");
  const [states, setStates] = useState([]);
  const [geoBoundingBox, setGeoBoundingBox] = useState({top: "", left: "", bottom: "", right: "",}); // Optional bounding box for location
  const [ageRange, setAgeRange] = useState([0, 20]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ field: "breed", direction: "asc" });
  const [favorites, setFavorites] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedZipCodes, setSelectedZipCodes] = useState([]);


  const navigate = useNavigate() // Redirect to login page after logout



  // Fetch breed list
  const { data: breedList } = useQuery(["breeds"], fetchBreeds, {
    onSuccess: (data) => setBreeds(data),
    onError: (error) => console.error("Failed to fetch breeds:", error.message),
  });

  // Fetch dog IDs based on search criteria
  // Ensure that selectedBreeds and ageRange are included in the query key to refetch when they change
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
     
    }
  );

  // Fetch full dog data based on search results, ensuring it's enabled correctly
  const { data: dogs, isLoading: isFetchingDogs } = useQuery(
    ["dogData", searchResults?.resultIds], // Only fetch if resultIds are available
    () => fetchDogs(searchResults?.resultIds), // Fetch dogs with the retrieved dog IDs
    {
      enabled: !!searchResults?.resultIds && searchResults.resultIds.length > 0,
      retry: false,
      staleTime: 3,
      onError: (error) => console.error("Failed to fetch dog data:", error.message),
      
    }
  );

  // Mutation to match dogs from favorites
  // Ensure that the mutation is only called when favorites are not empty
  const matchMutation = useMutation(matchDogs, {
    onSuccess: (matchedDog) => {
      setMatchResult(matchedDog); // Store the full matched dog object
    },
    onError: (error) => {
      toast.error("Failed to find a match. Please try again.", {timeout: 1000});
      console.error("Failed to fetch matched dog details:", error.message)},
    onSettled: () => {
      if (matchResult) {
        toast.success("Match found! Check your favorites.", {autoClose: 1000});
      }}
  });

  // Toggle favorite status for a dog
  const toggleFavorite = (dogId) => {
    setFavorites((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  };

  // Handle page change for pagination
  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  // Handle sort field change
  const handleSortFieldChange = (e) => {
    setSort((prev) => ({ ...prev, field: e.target.value }));
  };

  // Handle sort direction change
  const handleSortDirectionChange = (e) => {
    setSort((prev) => ({ ...prev, direction: e.target.value }));
  };

  
  // Handle location search with validation
  const handleLocationSearch = async () => {
    if (!city && states.length === 0 && !geoBoundingBox.top && !geoBoundingBox.left && !geoBoundingBox.bottom && !geoBoundingBox.right) {
      
      toast.error("Please enter a city or state to search for dogs.",{timeout: 1000});
      return;
    }
    // Fetch locations based on user input
    try {
      if (geoBoundingBox) {
        // Validate geoBoundingBox coordinates
        const { top, bottom, left, right } = geoBoundingBox;
  
        // Check if all the coordinates are valid numbers
        if (isNaN(top) || isNaN(bottom) || isNaN(left) || isNaN(right)) {
          toast.error("Invalid coordinates in bounding box", { timeout: 1000 });
          return;
        }
  
        // Ensure that the coordinates make sense: top > bottom, left < right
        if ((top >0 && top <= bottom) || (left>0 && left >= right)) {
          toast.error("Invalid bounding box coordinates", { timeout: 1000 });
          return;
        }
  
        // Check if the coordinates are within valid latitude and longitude ranges
        if (top > 90 || bottom < -90 || left < -180 || right > 180) {
          toast.error("Coordinates out of valid range", { timeout: 1000 });
          return;
        }
        if (top < -90 || bottom > 90 || left > 180 || right < -180) {
          toast.error("Coordinates out of valid range", { timeout: 1000 });
          return;
        }
      }
      // Fetch location data based on city, states, and geoBoundingBox
      const locationData = await fetchLocations({city, 
        states,
        geoBoundingBox: geoBoundingBox && geoBoundingBox.top && geoBoundingBox.bottom && geoBoundingBox.left && geoBoundingBox.right ? geoBoundingBox : undefined
      });
      console.log("Location Data:", locationData);
      if (locationData.resultIds && locationData.city !== city && locationData.states !== states || !geoBoundingBox) {
        toast.error("Enter a valid city or state",{timeout: 1000});
        return;
      }
  
    if (!locationData.results || locationData.results.length === 0) {
      toast.error("No Locations found for the given input.",{timeout: 1000});
     
      return;
    }
  
    // Extract ZIP codes from the response
    const zipCodes = locationData.results.map((location) => location.zip_code);

    // Set ZIP codes and trigger dog search
    setSelectedZipCodes(zipCodes);
   
    } catch (error) {
      toast.error(error.message || "Failed to fetch dogs for the provided location",{timeout: 1000});
    }
  };

  // Clear all filters and reset state
  const clearFilters = () => {
    
    setSelectedBreeds([]); 
    setAgeRange([0, 20]); // Reset age range (assuming default is 0-20)
    setSelectedZipCodes([]); // Reset selected zip codes (empty for no filter)
    setSort({ field: 'breed', direction: 'asc' }); // Reset sort to default (breed: ascending)
    setPage(1); // Reset page to the first page
    setCity(""); // Reset city input
    setStates([]); // Reset states input
    setGeoBoundingBox({ top: "", left: "", bottom: "", right: "" }); // Reset geo bounding box
    setFavorites([]); // Clear favorites
    setMatchResult(null); // Clear match result
  };
  
  

  return (

    
  <Container sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
  {/* Header Section */}
  <Typography variant="h4" align="center" gutterBottom>
    Browse Available Dogs
  </Typography>
  <Typography variant="subtitle1" align="center" gutterBottom>
    Select your favorite dogs and find your perfect match!
  </Typography>&nbsp;
  {/* Toast Container for Notifications */}
  {ToastContainer && (
    <ToastContainer
      position="top-right"
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick/>)}

  {/* Logout Button */}
  <Button
    variant="outlined"
    onClick={() => {
      navigate('/login');
    }}
    sx={{ position: "absolute", top: 1, right: 0 }}
  >
    Logout
  </Button>

  {/* Filters Section */}
  <Grid container spacing={4} justifyContent="space-between">
    {/* Breed Filter */}
    <Grid item md={5} sm={4}>
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

    {/* Age Slider */}
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

    {/* Location Inputs */}
    <Grid item md={5} sm={4} display="flex" flexDirection="row" gap={2}>
      <TextField
        label="Enter City"
        placeholder="e.g., NASHUA"
        variant="outlined"
  
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
       <TextField
        label="Enter State (e.g., CA, TX)"
        variant="outlined"
        
        value={states.join(", ")}
        onChange={(e) => setStates(e.target.value.split(",").map((s) => s.trim().toUpperCase()))}
      />
    </Grid>
    {/* Geo Bounding Box Inputs */}
    <Grid item xs={12} sm={6} display="flex" flexDirection="row" gap={2}>
    <TextField
      label="Top Latitude"
      type="number"
      variant="outlined"
      fullWidth
      value={geoBoundingBox.top || ""}
      onChange={(e) => setGeoBoundingBox({ ...geoBoundingBox, top: parseFloat(e.target.value) })}
    />
    <TextField
      label="Left Longitude"
      type="number"
      variant="outlined"
      fullWidth
      value={geoBoundingBox.left || ""}
      onChange={(e) => setGeoBoundingBox({ ...geoBoundingBox, left: parseFloat(e.target.value) })}
    />
  </Grid>

  <Grid item xs={12} sm={6} display="flex" flexDirection="row" gap={2}>
    <TextField
      label="Bottom Latitude"
      type="number"
      variant="outlined"
      fullWidth
      value={geoBoundingBox.bottom || ""}
      onChange={(e) => setGeoBoundingBox({ ...geoBoundingBox, bottom: parseFloat(e.target.value) })}
    />
    <TextField
      label="Right Longitude"
      type="number"
      variant="outlined"
      fullWidth
      value={geoBoundingBox.right || ""}
      onChange={(e) => setGeoBoundingBox({ ...geoBoundingBox, right: parseFloat(e.target.value) })}
    />
  </Grid>
      

    {/* Search Location Button */}
    <Grid item xs={12} sm={6} justifyContent={"center"} sx={{marginTop: 1}}>
      <Button variant="contained" color="primary" onClick={handleLocationSearch}>
        Search Location
      </Button>
    </Grid>

    {/* Sort Controls */}
    <Grid item md={10} sm={4} display="flex" flexDirection="row" justifyContent="space-between" gap={5}>
      <FormControl fullWidth>
        <InputLabel>Sort Direction</InputLabel>
        <Select value={sort.direction} onChange={handleSortDirectionChange}>
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Sort By</InputLabel>
        <Select value={sort.field} onChange={handleSortFieldChange}>
          <MenuItem value="breed">Breed</MenuItem>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="age">Age</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Clear Filters */}
    <Grid item lg={12} display="flex" justifyContent="center">
      <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
        Clear Filters
      </Button>
    </Grid>
  </Grid>
  
  {/* Divider for visual separation */}
  <Divider sx={{ width: "100%", mt: 4, mb: 2 }} />

  {/* Dogs Display Section */}
  <Grid container spacing={3} sx={{ mt: 3 }}>
    {isSearching && isFetchingDogs ? (
      <Typography>Loading dogs...</Typography>
    ) : dogs && dogs.length > 0 ? (
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
      ))
    ) : (
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
      onClick={() => matchMutation.mutate(favorites)}
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
