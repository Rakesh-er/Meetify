import React, { useContext, useState, useEffect } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert, Snackbar } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import PersonIcon from "@mui/icons-material/Person";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const { addToUserHistory, getCurrentUser } = useContext(AuthContext);

  useEffect(() => {
    // Fetch current user info
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    };
    fetchUser();
  }, [getCurrentUser]);

  useEffect(() => {
    // Check for active meeting
    const activeMeetingCode = localStorage.getItem('activeMeeting');
    const activeUsername = localStorage.getItem('activeMeetingUsername');

    if (activeMeetingCode && activeMeetingCode !== 'meeting') {
      setActiveMeeting({ code: activeMeetingCode, username: activeUsername });
      setShowCallPopup(true);
    }
  }, []);
  let handleJoinVideoCall = async () => {
    if (!meetingCode || meetingCode.trim() === "") {
      setError("Please enter the meeting code");
      return;
    }
    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch (e) {
      setError("Failed to join meeting. Please try again.");
    }
  };

  const handleReturnToCall = () => {
    if (activeMeeting) {
      navigate(`/${activeMeeting.code}`);
    }
    setShowCallPopup(false);
  };

  const handleDismissCall = () => {
    localStorage.removeItem('activeMeeting');
    localStorage.removeItem('activeMeetingUsername');
    setActiveMeeting(null);
    setShowCallPopup(false);
  };

  return (
    <>
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Meetify</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px", position: 'relative' }}>
          <Button
            onClick={() => {
              navigate("/history");
            }}
            variant="outlined"
            startIcon={<RestoreIcon />}
            sx={{
              color: '#667eea',
              borderColor: '#667eea',
              padding: '8px 20px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              borderRadius: '25px',
              '&:hover': {
                borderColor: '#5568d3',
                background: 'rgba(102, 126, 234, 0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            History
          </Button>
          <UserMenu currentUser={currentUser} onNavigate={navigate} />
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2>Providing Quality Video Call Just Like Quality Education</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <TextField
                  onChange={(e) => {
                    setMeetingCode(e.target.value);
                    setError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinVideoCall();
                    }
                  }}
                  id="outlined-basic"
                  label="Meeting Code"
                  variant="outlined"
                  fullWidth
                  error={!!error}
                  helperText={error}
                />
                <Button
                  onClick={handleJoinVideoCall}
                  variant="contained"
                  sx={{
                    minWidth: '120px',
                    fontSize: '1rem',
                    padding: '14px 28px'
                  }}
                >
                  Join
                </Button>
              </div>
              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img srcSet="/logo3.png" alt="" />
        </div>
      </div>

      {/* Active Call Popup - Full Screen */}
      <Dialog
        open={showCallPopup}
        onClose={handleDismissCall}
        maxWidth={false}
        fullWidth
        PaperProps={{
          style: {
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            margin: 0,
            borderRadius: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
          }
        }}
      >
        <DialogTitle style={{
          fontSize: '2rem',
          color: 'white',
          textAlign: 'center',
          padding: '40px 20px 20px 20px'
        }}>
          Ongoing Video Call
        </DialogTitle>
        <DialogContent style={{
          textAlign: 'center',
          padding: '20px 40px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <DialogContentText style={{
            fontSize: '1.3rem',
            color: 'white',
            marginBottom: '30px'
          }}>
            You have an ongoing video call in meeting:
          </DialogContentText>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#FFD700',
            marginBottom: '40px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {activeMeeting?.code}
          </div>
          <DialogContentText style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '40px'
          }}>
            Would you like to return to the call?
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{
          justifyContent: 'center',
          padding: '30px 40px',
          gap: '20px'
        }}>
          <Button
            onClick={handleDismissCall}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'white',
              padding: '12px 30px',
              fontSize: '1.1rem',
              '&:hover': {
                borderColor: 'white',
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Dismiss
          </Button>
          <Button
            onClick={handleReturnToCall}
            variant="contained"
            sx={{
              background: 'white',
              color: '#667eea',
              padding: '12px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)'
              }
            }}
          >
            Return to Call
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default withAuth(HomeComponent);

function UserMenu({ currentUser, onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [btnWidth, setBtnWidth] = React.useState(0);
  const [btnHeight, setBtnHeight] = React.useState(0);

  React.useEffect(() => {
    const measure = () => {
      if (btnRef.current) {
        setBtnWidth(btnRef.current.offsetWidth);
        setBtnHeight(btnRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  React.useEffect(() => {
    const handler = (e) => {
      if (open) {
        if (
          menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)
        ) {
          setOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const buttonLabel = currentUser?.name || currentUser?.username || 'User';

  return (
    <div style={{ position: 'relative' }}>
      <Button
        ref={btnRef}
        id="user-menu-button"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={() => setOpen(v => !v)}
        startIcon={<PersonIcon />}
        endIcon={<KeyboardArrowDownIcon style={{ transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
        variant="outlined"
        sx={{
          color: '#667eea',
          borderColor: '#667eea',
          padding: '8px 20px',
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          borderRadius: '25px'
        }}
      >
        {buttonLabel}
      </Button>
      <div
        ref={menuRef}
        role="menu"
        id="user-menu"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: btnWidth ? `${btnWidth}px` : '100%',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: open ? `${Math.max(40, btnHeight * 1.5)}px` : '0px',
          transition: 'max-height 200ms ease, opacity 200ms ease, transform 200ms ease',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(4px)' : 'translateY(0)',
          background: 'white',
          border: '1px solid #e0e0e0',
          boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '6px' }}>

          <Button
            onClick={() => { localStorage.removeItem('token'); onNavigate('/'); setOpen(false); }}
            color="error"
            sx={{ justifyContent: 'flex-start', padding: '8px 10px' }}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
