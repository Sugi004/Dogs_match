import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { TextField, Button, Container, Card, Typography, Box } from "@mui/material";
import gsap from "gsap";
import "./login.css";
import { ToastContainer, toast } from "react-toastify";
import image from "../../assets/image.png";



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

function Login() {
  const [formData, setFormData] = useState({ email: "", name: "" });
  const navigate = useNavigate();
  const formRef = useRef(null);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);

  // GSAP animation for the body
  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1 }
    );
    gsap.fromTo(
      formRef.current.children,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.2, duration: 0.8 }
    );
  }, []);

  // Login mutation using React Query
  // Fix: Use the correct API URL and handle success
  const loginMutation = useMutation(loginUser, {
    onSuccess: () => {
      navigate("/dogs");
    },
  });

  // Handle form input changes
  const handleInput = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  // Handle form submission
  // Fix: Prevent default form submission and use React Query mutation to handle login
  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <>
    
    <Container
      maxWidth="md"
      sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" ,width: "100vw"}}
    >
      {/* Toast Container for Notifications */}
        {ToastContainer && (
          <ToastContainer
            position="top-right"
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick/>)
        }
        <Box
        sx={{
        flex: 1,
        textAlign: "center",
        marginBottom: 4,
        padding: 5,}}
        >
       
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#333" }}>
        Welcome to Dog Match
        </Typography>
        
       
        <img
        src={image}
        alt="Dog Match Logo"
        style={{ width: "400px", height: "300px", marginTop: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}
        />

        <Typography variant="subtitle1" sx={{ color: "#666", marginTop: 4 }}>
        Please login to continue
        </Typography>
        </Box>
      {/* Login card*/}
      <Card
        sx={{ padding: 4, boxShadow: 3, width: "100%", 
            maxWidth: 450, 
            backdropFilter: "blur(100px)",  
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "16px", 
            height: "400px"}}
            ref={cardRef}
            
        >
        
        <Typography variant="h5" align="center" sx={{ marginBottom: 8, fontWeight: "bold", color: "#333" }}>
          
          Login
        </Typography>
        <Box component="form" onSubmit={handleLogin} ref={formRef} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInput}
            fullWidth
            required
          />
          <TextField
            label="Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInput}
            fullWidth
            required
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loginMutation.isLoading}
            fullWidth
            sx={{ marginTop: 4, padding: "10px 0", fontSize: "16px", fontWeight: "bold" }}
            ref={buttonRef}
            onMouseEnter={() => gsap.to(buttonRef.current, { scale: 1.1, duration: 0.2 })}
            onMouseLeave={() => gsap.to(buttonRef.current, { scale: 1, duration: 0.2 })}
          >
            {loginMutation.isLoading ? "Logging in..." : "Login"}
          </Button>
          {loginMutation.isError && (
            <Typography color="error" align="center">
              Login failed. Try again.
            </Typography>
          )}
        </Box>
      </Card>
    </Container>
    </>
  );
}

export default Login;
