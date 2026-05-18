// src/component/dashboard/seller/sellerDocumentVerification.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Upload,
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Description,
  AssignmentInd,
  Business,
  AccountBalance,
  Receipt,
  Visibility,
  Download,
  VerifiedUser,
  Error
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const documentTypes = [
  {
    id: 'id_proof',
    name: 'Government ID Proof',
    description: 'Passport, Driver\'s License, or National ID Card',
    icon: <AssignmentInd />,
    required: true,
    status: 'pending'
  },
  {
    id: 'business_license',
    name: 'Business License',
    description: 'Valid business license or registration certificate',
    icon: <Business />,
    required: true,
    status: 'pending'
  },
  {
    id: 'tax_id',
    name: 'Tax ID / VAT Certificate',
    description: 'Tax registration document',
    icon: <AccountBalance />,
    required: true,
    status: 'pending'
  },
  {
    id: 'bank_details',
    name: 'Bank Account Details',
    description: 'Bank statement or cancelled cheque',
    icon: <Receipt />,
    required: true,
    status: 'pending'
  },
  {
    id: 'property_ownership',
    name: 'Property Ownership Proof',
    description: 'Title deed or ownership certificate (if applicable)',
    icon: <Description />,
    required: false,
    status: 'pending'
  }
];

const verificationSteps = [
  'Documents Submitted',
  'Initial Review',
  'Verification in Progress',
  'Final Approval'
];

const SellerDocumentVerification = () => {
  const [documents, setDocuments] = useState(documentTypes);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, in_review, approved, rejected
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [verificationProgress, setVerificationProgress] = useState(25);

  useEffect(() => {
    // Fetch existing verification status from API
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    // Simulate API call
    setTimeout(() => {
      // Mock data - in real app, fetch from backend
      const savedDocs = JSON.parse(localStorage.getItem('sellerDocuments') || '{}');
      if (Object.keys(savedDocs).length > 0) {
        setUploadedFiles(savedDocs);
        updateDocumentStatuses(savedDocs);
      }
    }, 1000);
  };

  const updateDocumentStatuses = (files) => {
    const updatedDocs = documents.map(doc => ({
      ...doc,
      status: files[doc.id] ? 'uploaded' : 'pending'
    }));
    setDocuments(updatedDocs);
    
    const allUploaded = updatedDocs.every(doc => doc.status === 'uploaded');
    if (allUploaded && verificationStatus === 'pending') {
      setVerificationStatus('in_review');
      setVerificationProgress(50);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        alert('File too large or invalid format. Max size 5MB, allowed: PDF, JPG, PNG');
        return;
      }
      if (currentDocument) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    multiple: false
  });

  const handleFileUpload = async (file) => {
    if (!currentDocument) return;
    
    setLoading(true);
    
    // Simulate file upload to server
    setTimeout(() => {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        preview: URL.createObjectURL(file)
      };
      
      const updatedFiles = { ...uploadedFiles, [currentDocument.id]: fileData };
      setUploadedFiles(updatedFiles);
      
      const updatedDocs = documents.map(doc =>
        doc.id === currentDocument.id ? { ...doc, status: 'uploaded' } : doc
      );
      setDocuments(updatedDocs);
      
      // Save to localStorage (temporary - use backend in production)
      localStorage.setItem('sellerDocuments', JSON.stringify(updatedFiles));
      
      setLoading(false);
      setOpenDialog(false);
      setCurrentDocument(null);
      
      // Check if all required documents are uploaded
      const allRequiredUploaded = updatedDocs
        .filter(doc => doc.required)
        .every(doc => doc.status === 'uploaded');
      
      if (allRequiredUploaded && verificationStatus === 'pending') {
        setVerificationStatus('in_review');
        setVerificationProgress(50);
      }
    }, 1500);
  };

  const handleViewDocument = (docId) => {
    const file = uploadedFiles[docId];
    if (file && file.preview) {
      window.open(file.preview, '_blank');
    }
  };

  const handleDeleteDocument = (docId) => {
    const updatedFiles = { ...uploadedFiles };
    delete updatedFiles[docId];
    setUploadedFiles(updatedFiles);
    
    const updatedDocs = documents.map(doc =>
      doc.id === docId ? { ...doc, status: 'pending' } : doc
    );
    setDocuments(updatedDocs);
    
    localStorage.setItem('sellerDocuments', JSON.stringify(updatedFiles));
    
    if (verificationStatus === 'in_review') {
      setVerificationStatus('pending');
      setVerificationProgress(25);
    }
  };

  const handleSubmitForVerification = async () => {
    const requiredDocs = documents.filter(doc => doc.required);
    const allUploaded = requiredDocs.every(doc => doc.status === 'uploaded');
    
    if (!allUploaded) {
      alert('Please upload all required documents before submitting for verification');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call to submit for verification
    setTimeout(() => {
      setVerificationStatus('in_review');
      setVerificationProgress(50);
      setLoading(false);
      
      // Show success message
      alert('Documents submitted for verification successfully!');
    }, 2000);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'rejected': return <Cancel sx={{ color: 'error.main' }} />;
      case 'uploaded': return <CheckCircle sx={{ color: 'info.main' }} />;
      case 'in_review': return <Pending sx={{ color: 'warning.main' }} />;
      default: return <Warning sx={{ color: 'text.secondary' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'uploaded': return 'info';
      case 'in_review': return 'warning';
      default: return 'default';
    }
  };

  const getVerificationStep = () => {
    if (verificationStatus === 'approved') return 3;
    if (verificationStatus === 'in_review') return 2;
    if (verificationStatus === 'rejected') return 1;
    return 0;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>Document Verification</Typography>
        <Typography variant="body1">
          Complete your verification to unlock all seller features and start listing properties
        </Typography>
      </Paper>

      {/* Verification Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Verification Status</Typography>
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {verificationStatus === 'approved' && '✓ Verified Account'}
              {verificationStatus === 'in_review' && '⏳ Verification in Progress'}
              {verificationStatus === 'rejected' && '✗ Verification Failed'}
              {verificationStatus === 'pending' && '📄 Documents Pending'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {verificationProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={verificationProgress} 
            sx={{ height: 8, borderRadius: 4 }}
            color={verificationStatus === 'approved' ? 'success' : 'primary'}
          />
        </Box>

        <Stepper activeStep={getVerificationStep()} alternativeLabel sx={{ mt: 3 }}>
          {verificationSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {verificationStatus === 'rejected' && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">Verification Failed</Typography>
            <Typography variant="body2">Reason: {rejectionReason || 'Documents are invalid or unclear. Please re-upload clear copies.'}</Typography>
          </Alert>
        )}

        {verificationStatus === 'approved' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">Verification Complete!</Typography>
            <Typography variant="body2">Your account is fully verified. You can now list properties and receive payments.</Typography>
          </Alert>
        )}
      </Paper>

      {/* Documents Section */}
      <Typography variant="h6" gutterBottom>Required Documents</Typography>
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} key={doc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2, color: doc.required ? 'primary.main' : 'text.secondary' }}>
                    {doc.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">
                      {doc.name}
                      {doc.required && (
                        <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doc.description}
                    </Typography>
                  </Box>
                  {getStatusIcon(doc.status)}
                </Box>
                
                {uploadedFiles[doc.id] && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Uploaded: {new Date(uploadedFiles[doc.id].uploadDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      File: {uploadedFiles[doc.id].name}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                {!uploadedFiles[doc.id] ? (
                  <Button
                    startIcon={<Upload />}
                    onClick={() => {
                      setCurrentDocument(doc);
                      setOpenDialog(true);
                    }}
                    disabled={loading || verificationStatus === 'approved'}
                  >
                    Upload Document
                  </Button>
                ) : (
                  <>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      Download
                    </Button>
                    {verificationStatus !== 'approved' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Submit Button */}
      {verificationStatus === 'pending' && (
        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Once you've uploaded all required documents, submit them for verification
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<VerifiedUser />}
            onClick={handleSubmitForVerification}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </Paper>
      )}

      {verificationStatus === 'in_review' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">Under Review</Typography>
          <Typography variant="body2">
            Our team is reviewing your documents. This usually takes 1-2 business days.
            You will be notified once the verification is complete.
          </Typography>
        </Alert>
      )}

      {/* Upload Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload {currentDocument?.name}
          {currentDocument?.required && <Chip label="Required" size="small" color="error" sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              mt: 2,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' }
            }}
          >
            <input {...getInputProps()} />
            <Upload sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
            <Typography variant="body1">Drag & drop or click to upload</Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: PDF, JPG, PNG (Max 5MB)
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Requirements:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
              <ListItemText primary="Clear and legible document" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
              <ListItemText primary="Maximum file size: 5MB" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
              <ListItemText primary="Document must be valid and not expired" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerDocumentVerification;