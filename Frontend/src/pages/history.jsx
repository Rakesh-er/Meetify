import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";

export default function History() {
  const { getHistoryOfUser, deleteHistoryItem, clearAllHistory } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  const routeTo = useNavigate();
  
  const fetchHistory = async () => {
    try {
      const history = await getHistoryOfUser();
      setMeetings(history);
    } catch {
      // IMPLEMENT SNACKBAR
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);
  
  const handleDelete = async (meetingId) => {
    try {
      await deleteHistoryItem(meetingId);
      await fetchHistory();
      setShowDeleteDialog(false);
      setMeetingToDelete(null);
    } catch (e) {
      console.error("Error deleting:", e);
    }
  };
  
  const handleClearAll = async () => {
    try {
      await clearAllHistory();
      await fetchHistory();
      setShowClearDialog(false);
    } catch (e) {
      console.error("Error clearing:", e);
    }
  };

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          background: 'white',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ 
            margin: 0, 
            color: '#667eea',
            fontSize: '2rem'
          }}>
            Meeting History
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {meetings.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowClearDialog(true)}
                sx={{ marginRight: '10px' }}
              >
                Clear All
              </Button>
            )}
            <IconButton
              onClick={() => {
                routeTo("/home");
              }}
              sx={{
                background: '#667eea',
                color: 'white',
                '&:hover': {
                  background: '#5568d3'
                }
              }}
            >
              <HomeIcon />
            </IconButton>
          </div>
        </div>
        
        {meetings.length !== 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {meetings.map((e, i) => {
              return (
                <Card 
                  key={i} 
                  variant="outlined"
                  sx={{
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography
                      sx={{ 
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: '#667eea',
                        marginBottom: '10px'
                      }}
                      gutterBottom
                    >
                      Meeting Code: {e.meetingCode}
                    </Typography>

                    <Typography 
                      sx={{ 
                        mb: 1.5,
                        color: '#666',
                        fontSize: '0.95rem'
                      }} 
                      color="text.secondary"
                    >
                      Date: {formatDate(e.date)}
                    </Typography>
                    {e.duration && (
                      <Typography sx={{ color: '#444', fontSize: '0.95rem' }}>
                        Duration: {e.duration}
                      </Typography>
                    )}
                    {/* opponent and status removed per requirements */}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', padding: '10px 16px' }}>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => routeTo(`/${e.meetingCode}`)}
                      sx={{
                        background: '#667eea',
                        '&:hover': {
                          background: '#5568d3'
                        }
                      }}
                    >
                      Join Again
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setMeetingToDelete(e._id);
                        setShowDeleteDialog(true);
                      }}
                      sx={{
                        '&:hover': {
                          background: 'rgba(244, 67, 54, 0.1)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card sx={{
            padding: '60px 20px',
            textAlign: 'center',
            borderRadius: '15px',
            background: 'white',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ fontSize: '1.2rem', color: '#999' }}
            >
              No meeting history yet
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ marginTop: '10px', color: '#bbb' }}
            >
              Your past meetings will appear here
            </Typography>
          </Card>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setMeetingToDelete(null);
          }}
        >
          <DialogTitle>Delete Meeting?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this meeting from your history? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowDeleteDialog(false);
              setMeetingToDelete(null);
            }} color="primary">
              Cancel
            </Button>
            <Button onClick={() => handleDelete(meetingToDelete)} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Clear All Confirmation Dialog */}
        <Dialog
          open={showClearDialog}
          onClose={() => setShowClearDialog(false)}
        >
          <DialogTitle>Clear All History?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete all meeting history? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowClearDialog(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleClearAll} color="error" variant="contained">
              Clear All
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
