import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { TextField, Button, Container, Card, Typography, Box } from "@mui/material";
import gsap from "gsap";
import "./Login.css";

const setToken = (token) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + 60 * 60 * 1000); // Set expiration to 1 hour
    
    // Set the cookie with the fetched token (in a client-side accessible cookie)
    document.cookie = `fetch-token=${token}; expires=${expires.toUTCString()}; path=/; secure; SameSite=Strict`;
  };


const loginUser = async ({ email, name }) => {
  console.log("Logging in with:", email, name);
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/login`,
    { email, name },
    { withCredentials: true }

  );

  if (response.status === 200) {
    const token = response.data.token; 
    console.log(response.data);
    setToken(token); // Set the front-end cookie for 1 hour
  }
  return response.status;
};

function Login() {
  const [formData, setFormData] = useState({ email: "", name: "" });
  const navigate = useNavigate();
  const formRef = useRef(null);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);

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

  const loginMutation = useMutation(loginUser, {
    onSuccess: () => {
      navigate("/dogs");
    },
  });

  const handleInput = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
        </Box>
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
