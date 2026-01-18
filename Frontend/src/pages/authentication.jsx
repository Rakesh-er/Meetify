import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LoginIcon from "@mui/icons-material/Login";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import { Snackbar, Alert, Tabs, Tab } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Theme Configuration
const theme = createTheme({
  palette: {
    primary: {
      main: "#667eea",
    },
    secondary: {
      main: "#764ba2",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 100px #ffffff inset",
            WebkitTextFillColor: "inherit",
            transition: "background-color 5000s ease-in-out 0s",
          },
        },
      },
    },
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const navigate = useNavigate();
  const authContext = React.useContext(AuthContext);

  // Safe fallbacks if context is missing
  const handleRegister =
    authContext?.handleRegister || (async () => "Registered");
  const handleLogin = authContext?.handleLogin || (async () => "Logged In");

  const handleAuth = async () => {
    setError("");
    try {
      if (formState === 0) {
        if (!username || !password) {
          setError("Please fill in all fields");
          return;
        }
        await handleLogin(username, password);
      }
      if (formState === 1) {
        if (!name || !username || !password) {
          setError("Please fill in all fields");
          return;
        }
        let result = await handleRegister(name, username, password);
        console.log(result);
        setName("");
        setUsername("");
        setPassword("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
      }
    } catch (err) {
      console.log("Error:", err);
      let message =
        err.response?.data?.message || err.message || "An error occurred";
      setError(message);
      setOpen(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setFormState(newValue);
    setError("");
    setUsername("");
    setPassword("");
    setName("");
  };

  const formVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid
        container
        component="main"
        sx={{ height: "100vh" }}
      >
        <CssBaseline />

        {/* LEFT SIDE: Image & Branding
          - xs={false}: Hidden on mobile
          - sm={4}: 33% on tablet
          - md={7}: ~58% on desktop
        */}
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            p: 4,
            overflow: "hidden",
          }}
        >
          {/* Back Button */}
          <IconButton
            onClick={() => navigate("/")}
            sx={{
              position: "absolute",
              top: 30,
              left: 30,
              zIndex: 10,
              color: "white",
              bgcolor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(5px)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.3)",
                transform: "translateX(-3px)",
              },
            }}
          >
            <ArrowBackIcon fontSize="large" />
          </IconButton>

          {/* Text Content */}
          <Box sx={{ textAlign: "center", color: "white", zIndex: 2, px: 2 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { sm: "2.5rem", md: "3.75rem" },
                textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              Welcome to Meetify
            </Typography>
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                fontWeight: 300,
                fontSize: { sm: "1.2rem", md: "1.5rem" },
                textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              Connect with your loved ones through quality video calls
            </Typography>
          </Box>

          {/* Background Image Overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "url('https://images.unsplash.com/photo-1557683316-973673baf926?w=800')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.2,
            }}
          />
        </Grid>

        {/* RIGHT SIDE: Form
          - xs={12}: Full width on mobile
          - sm={8}: 66% on tablet
          - md={5}: ~42% on desktop
        */}
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={6}
          square
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              formState === 0
                ? "linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)"
                : "linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 450, 
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: { xs: 2, sm: 4, md: 6 },
            }}
          >

            <Box
              sx={{ width: "100%", display: { xs: "flex", sm: "none" }, mb: 2 }}
            >
              <IconButton onClick={() => navigate("/")}>
                <ArrowBackIcon />
              </IconButton>
            </Box>

            <Avatar
              component={motion.div}
              animate={{ rotate: formState === 0 ? 0 : 360 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              sx={{
                m: 1,
                bgcolor: formState === 0 ? "primary.main" : "secondary.main",
                width: 70,
                height: 70,
              }}
            >
              {formState === 0 ? (
                <LoginIcon sx={{ fontSize: 40 }} />
              ) : (
                <PersonAddIcon sx={{ fontSize: 40 }} />
              )}
            </Avatar>

            <Typography
              component="h1"
              variant="h4"
              sx={{ mb: 2, fontWeight: 600 }}
            >
              {formState === 0 ? "Sign In" : "Sign Up"}
            </Typography>

            <Box sx={{ width: "100%", mb: 3 }}>
              <Tabs
                value={formState}
                onChange={handleTabChange}
                centered
                variant="fullWidth" // Ensures tabs fill the width of the form container
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 500,
                  },
                }}
              >
                <Tab label="Login" />
                <Tab label="Sign Up" />
              </Tabs>
            </Box>

            <AnimatePresence mode="wait">
              <Box
                key={formState}
                component={motion.form}
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                noValidate
                sx={{ mt: 1, width: "100%" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAuth();
                }}
              >
                {formState === 1 && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="off"
                  autoFocus={formState === 0}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />

                {error && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    background:
                      formState === 0
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    "&:hover": {
                      background:
                        formState === 0
                          ? "linear-gradient(135deg, #5568d3 0%, #653a8f 100%)"
                          : "linear-gradient(135deg, #653a8f 0%, #5568d3 100%)",
                    },
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {formState === 0 ? "Sign In" : "Sign Up"}
                </Button>
              </Box>
            </AnimatePresence>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
