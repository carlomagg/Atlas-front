import React, { useState, useEffect } from 'react';
import { invoiceApi, statementApi, businessApi, invoiceDocumentApi } from '../../services/transactionApi';
import SuccessAlert from '../common/SuccessAlert';

const TransactionActivities = () => {
  const [activeSection, setActiveSection] = useState('generateStatement');
  const [showGeneralStatementTable, setShowGeneralStatementTable] = useState(false);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Statement data
  const [statements, setStatements] = useState([]);
  const [statementForm, setStatementForm] = useState({
    start_date: '',
    end_date: '',
    company: '',
  });
  
  // Invoice data
  const [invoices, setInvoices] = useState([]);
  const [sentInvoices, setSentInvoices] = useState([]);
  const [receivedInvoices, setReceivedInvoices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [acceptedInvoices, setAcceptedInvoices] = useState([]);
  const [rejectedInvoices, setRejectedInvoices] = useState([]);
  
  // Invoice filtering state
  const [invoiceFilter, setInvoiceFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'
  
  // Create invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    company: '',
    recipient: '',
    reference_number: '',
    transaction_date: '',
    payment_mode: 'CASH',
    additional_charges: '0',
    driver_name: '',
    driver_contact: '',
    vehicle_number: '',
    notes: '',
    supporting_document: null,
    items: [{ product_name: '', quantity: '1', rate: '0' }]
  });
  
  // Company search state
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Recipient search state
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectInvoiceId, setRejectInvoiceId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // View invoice modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  
  // Upload invoice data
  const [uploadInvoiceData, setUploadInvoiceData] = useState({
    recipient: '',
    invoice_file: null,
    status: 'DRAFT',
    notes: ''
  });
  
  // Invoice documents state
  const [invoiceDocuments, setInvoiceDocuments] = useState([]);
  const [receivedDocuments, setReceivedDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'batch'
  const [documentFilter, setDocumentFilter] = useState('sent'); // 'sent' or 'received'
  
  // Statement management state
  const [statementHistory, setStatementHistory] = useState([]);
  const [statementFilter, setStatementFilter] = useState('all'); // 'all', 'created', 'received'
  const [statementSearchTerm, setStatementSearchTerm] = useState('');
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [showStatementDetails, setShowStatementDetails] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Business search
  const [businesses, setBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data based on active section
  useEffect(() => {
    switch (activeSection) {
      case 'generateStatement':
        loadStatements();
        loadStatementHistory();
        loadBusinesses();
        break;
      case 'uploadInvoice':
        loadInvoiceDocuments();
        break;
      case 'createInvoice':
        loadBusinesses();
        break;
      case 'acceptInvoice':
        loadReceivedInvoices();
        break;
      default:
        break;
    }
  }, [activeSection]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStatements(),
        loadReceivedInvoices()
      ]);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatements = async () => {
    try {
      const data = await statementApi.getStatements();
      console.log('Statements data:', data);
      if (data.results && data.results.length > 0) {
        console.log('First statement structure:', data.results[0]);
      }
      setStatements(data.results || data);
    } catch (err) {
      console.error('Error loading statements:', err);
      setError('Failed to load statements: ' + err.message);
    }
  };

  const loadSentInvoices = async () => {
    try {
      const data = await invoiceApi.getSentInvoices();
      setSentInvoices(data.results || data);
    } catch (err) {
      console.error('Error loading sent invoices:', err);
    }
  };

  const loadReceivedInvoices = async () => {
    try {
      const data = await invoiceApi.getReceivedInvoices();
      console.log('Received invoices data:', data);
      if (data.results && data.results.length > 0) {
        console.log('First invoice structure:', data.results[0]);
      }
      const allInvoices = data.results || data;
      setReceivedInvoices(allInvoices);
      
      // Filter invoices by status
      const pending = allInvoices.filter(invoice => invoice.status === 'PENDING');
      const accepted = allInvoices.filter(invoice => invoice.status === 'ACCEPTED');
      const rejected = allInvoices.filter(invoice => invoice.status === 'REJECTED');
      
      setPendingInvoices(pending);
      setAcceptedInvoices(accepted);
      setRejectedInvoices(rejected);
    } catch (err) {
      setError('Failed to load received invoices');
      console.error('Error loading received invoices:', err);
    }
  };

  const loadBusinesses = async (query = '') => {
    try {
      const data = await businessApi.searchBusinesses({ q: query });
      // Filter to only show verified businesses
      const verifiedBusinesses = (data.results || data).filter(
        business => business.business_verification_status === 'VERIFIED'
      );
      setBusinesses(verifiedBusinesses);
    } catch (err) {
      console.error('Error loading businesses:', err);
    }
  };

  const loadInvoiceDocuments = async () => {
    try {
      const [sentData, receivedData] = await Promise.all([
        invoiceDocumentApi.getInvoiceDocuments(),
        invoiceDocumentApi.getReceivedInvoiceDocuments()
      ]);
      setInvoiceDocuments(sentData.results || sentData);
      setReceivedDocuments(receivedData.results || receivedData);
    } catch (err) {
      console.error('Error loading invoice documents:', err);
    }
  };

  const loadStatementHistory = async () => {
    try {
      const data = await statementApi.getStatementHistory();
      setStatementHistory(data.results || data);
    } catch (err) {
      console.error('Error loading statement history:', err);
      setError('Failed to load statement history: ' + err.message);
    }
  };

  const handleSearchStatements = async (searchTerm) => {
    if (!searchTerm.trim()) {
      loadStatementHistory();
      return;
    }
    
    try {
      const data = await statementApi.searchStatements(searchTerm);
      setStatementHistory(data.results || data);
    } catch (err) {
      console.error('Error searching statements:', err);
    }
  };

  const showConfirmation = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    if (confirmAction) {
      await confirmAction();
    }
  };

  const handleDeleteStatement = async (statementId) => {
    showConfirmation(
      'Are you sure you want to delete this statement? This action cannot be undone.',
      async () => {
        setLoading(true);
        try {
          await statementApi.deleteStatement(statementId);
          await loadStatementHistory();
          setSuccessMessage('Statement deleted successfully!');
        } catch (err) {
          setError(err.message || 'Failed to delete statement');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleViewStatement = async (statementId) => {
    setLoading(true);
    try {
      // Use regular statement endpoint which already includes detailed transactions
      const data = await statementApi.getStatement(statementId);
      console.log('Statement data with detailed transactions:', data);
      setSelectedStatement(data);
      setShowStatementDetails(true);
    } catch (err) {
      setError(err.message || 'Failed to load statement details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportStatement = (statement) => {
    // Create HTML content for the statement
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Statement - ${statement.reference_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .statement-title { font-size: 20px; margin: 10px 0; }
          .reference { color: #666; font-size: 14px; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #007bff; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin-bottom: 8px; }
          .info-label { font-weight: bold; color: #555; }
          .info-value { color: #333; }
          .financial-summary { background-color: #f8f9fa; }
          .amount { font-size: 18px; font-weight: bold; color: #28a745; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">Atlas WD</div>
          <div class="statement-title">Financial Statement</div>
          <div class="reference">Reference: ${statement.reference_number}</div>
          <div class="reference">Atlas WD ID: ${statement.atlas_wd_id}</div>
        </div>

        <div class="section financial-summary">
          <div class="section-title">Financial Summary</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Total Amount:</div>
              <div class="info-value amount">₦${parseFloat(statement.total_amount || 0).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Transaction Count:</div>
              <div class="info-value">${statement.transaction_count}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Period:</div>
              <div class="info-value">${new Date(statement.start_date).toLocaleDateString()} - ${new Date(statement.end_date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Generated On:</div>
              <div class="info-value">${new Date(statement.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        ${statement.company_details ? `
        <div class="section">
          <div class="section-title">Company Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Company Name:</div>
              <div class="info-value">${statement.company_details.company_name || statement.company_details.full_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Atlas ID:</div>
              <div class="info-value">${statement.company_details.atlas_id}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${statement.recipient_details ? `
        <div class="section">
          <div class="section-title">Recipient Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Recipient Name:</div>
              <div class="info-value">${statement.recipient_details.company_name || statement.recipient_details.full_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Atlas ID:</div>
              <div class="info-value">${statement.recipient_details.atlas_id}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>This statement was generated automatically by Atlas WD Financial System</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
      // Close the window after printing (optional)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  // API Handler Functions
  const handleGenerateStatement = async () => {
    if (!statementForm.start_date || !statementForm.end_date) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      // Clean up the form data - remove empty fields
      const cleanedData = {
        start_date: statementForm.start_date,
        end_date: statementForm.end_date
      };
      
      // Only add company and recipient if they have values
      if (statementForm.company) {
        cleanedData.company = statementForm.company;
      }
      if (statementForm.recipient) {
        cleanedData.recipient = statementForm.recipient;
      }
      
      console.log('Generating statement with cleaned data:', cleanedData);
      const data = await statementApi.generateStatement(cleanedData);
      
      // Add to statements list and reload history
      setStatements(prev => [data, ...prev]);
      await loadStatementHistory();
      
      // Reset form
      setStatementForm({
        start_date: '',
        end_date: '',
        company: '',
        recipient: ''
      });
      
      setError(null);
      setSuccessMessage(`Statement generated successfully! Reference: ${data.reference_number}`);
    } catch (err) {
      setError(err.message || 'Failed to generate statement');
      console.error('Error generating statement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced company search with debouncing
  const searchCompanies = async (searchTerm, isRecipient = false) => {
    if (searchTerm.length < 2) {
      if (isRecipient) {
        setRecipientOptions([]);
      } else {
        setCompanyOptions([]);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const data = await businessApi.searchBusinesses({ q: searchTerm });
      // Filter to only show verified businesses
      const verifiedBusinesses = (data.results || data).filter(
        business => business.business_verification_status === 'VERIFIED'
      );
      
      if (isRecipient) {
        setRecipientOptions(verifiedBusinesses);
      } else {
        setCompanyOptions(verifiedBusinesses);
      }
    } catch (err) {
      console.error('Error searching companies:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search function
  const debounceSearch = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const debouncedCompanySearch = debounceSearch(searchCompanies, 300);

  const handleCompanySelect = (company, isRecipient = false) => {
    if (isRecipient) {
      setSelectedRecipient(company);
      setRecipientSearchTerm(company.company_name || company.full_name);
      setInvoiceForm(prev => ({ ...prev, recipient: company.id }));
      setRecipientOptions([]);
    } else {
      setSelectedCompany(company);
      setCompanySearchTerm(company.company_name || company.full_name);
      setInvoiceForm(prev => ({ ...prev, company: company.id }));
      setCompanyOptions([]);
    }
  };

  const generateReferenceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const calculateInvoiceTotal = () => {
    const itemsTotal = invoiceForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0));
    }, 0);
    const additionalCharges = parseFloat(invoiceForm.additional_charges || 0);
    return itemsTotal + additionalCharges;
  };

  const handleCreateInvoice = async () => {
    // Enhanced validation according to API specification
    const validationErrors = [];

    if (!selectedCompany) {
      validationErrors.push('Please select a company');
    }

    if (!invoiceForm.transaction_date) {
      validationErrors.push('Please select transaction date');
    }

    if (!invoiceForm.payment_mode) {
      validationErrors.push('Please select payment mode');
    }

    if (!invoiceForm.driver_name?.trim()) {
      validationErrors.push('Driver name is required');
    }

    if (!invoiceForm.driver_contact?.trim()) {
      validationErrors.push('Driver contact is required');
    }

    if (!invoiceForm.vehicle_number?.trim()) {
      validationErrors.push('Vehicle number is required');
    }

    // Validate items
    if (!invoiceForm.items || invoiceForm.items.length === 0) {
      validationErrors.push('Please add at least one invoice item');
    } else {
      invoiceForm.items.forEach((item, index) => {
        if (!item.product_name?.trim()) {
          validationErrors.push(`Item ${index + 1}: Product name is required`);
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          validationErrors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (!item.rate || parseFloat(item.rate) <= 0) {
          validationErrors.push(`Item ${index + 1}: Rate must be greater than 0`);
        }
      });
    }

    // Validate additional charges if provided
    if (invoiceForm.additional_charges && isNaN(parseFloat(invoiceForm.additional_charges))) {
      validationErrors.push('Additional charges must be a valid number');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    // Generate reference number if not provided
    if (!invoiceForm.reference_number) {
      invoiceForm.reference_number = generateReferenceNumber();
    }

    setLoading(true);
    try {
      // Handle file upload to Cloudinary if supporting document is provided
      let supportingDocumentUrl = null;
      if (invoiceForm.supporting_document && invoiceForm.supporting_document instanceof File) {
        try {
          // Upload file to Cloudinary (you'll need to implement this function)
          // For now, we'll skip the file upload and set to null to avoid the validation error
          console.log('File upload to Cloudinary needed:', invoiceForm.supporting_document.name);
          // supportingDocumentUrl = await uploadToCloudinary(invoiceForm.supporting_document);
        } catch (uploadErr) {
          console.error('Error uploading file to Cloudinary:', uploadErr);
          setError('Failed to upload supporting document. Please try again.');
          setLoading(false);
          return;
        }
      } else if (typeof invoiceForm.supporting_document === 'string') {
        // If it's already a URL string, use it directly
        supportingDocumentUrl = invoiceForm.supporting_document;
      }

      // Prepare invoice data according to API specification
      // Note: Selected company becomes the recipient, logged-in user's company is automatically the issuer
      const invoiceData = {
        recipient: selectedCompany.id,
        transaction_date: invoiceForm.transaction_date,
        payment_mode: invoiceForm.payment_mode,
        additional_charges: parseFloat(invoiceForm.additional_charges || 0),
        driver_name: invoiceForm.driver_name,
        driver_contact: invoiceForm.driver_contact,
        vehicle_number: invoiceForm.vehicle_number,
        supporting_document: supportingDocumentUrl,
        notes: invoiceForm.notes || '',
        items: invoiceForm.items.map(item => ({
          product_name: item.product_name,
          quantity: parseFloat(item.quantity || 0),
          rate: parseFloat(item.rate || 0)
        }))
      };

      // Add reference number if provided
      if (invoiceForm.reference_number) {
        invoiceData.reference_number = invoiceForm.reference_number;
      }

      console.log('Sending invoice data:', invoiceData);

      const data = await invoiceApi.createInvoice(invoiceData);
      setSentInvoices(prev => [data, ...prev]);
      
      // Reset form
      setInvoiceForm({
        company: '',
        recipient: '',
        reference_number: '',
        transaction_date: '',
        payment_mode: 'CASH',
        additional_charges: '0',
        driver_name: '',
        driver_contact: '',
        vehicle_number: '',
        notes: '',
        supporting_document: null,
        items: [{ product_name: '', quantity: '1', rate: '0' }]
      });
      
      // Reset selections
      setSelectedCompany(null);
      setSelectedRecipient(null);
      setCompanySearchTerm('');
      setRecipientSearchTerm('');
      
      setError(null);
      setSuccessMessage('Invoice created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create invoice');
      console.error('Error creating invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      await invoiceApi.acceptInvoice(invoiceId);
      await loadReceivedInvoices(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to accept invoice');
      console.error('Error accepting invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (invoiceId) => {
    setRejectInvoiceId(invoiceId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectInvoiceId(null);
    setRejectionReason('');
  };

  const handleRejectInvoice = async (invoiceId, reason) => {
    setLoading(true);
    try {
      await invoiceApi.rejectInvoice(invoiceId, reason);
      // Refresh the received invoices list
      loadReceivedInvoices();
      setError(null);
      closeRejectModal();
      setSuccessMessage('Invoice rejected successfully!');
    } catch (err) {
      setError(err.message || 'Failed to reject invoice');
      console.error('Error rejecting invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    handleRejectInvoice(rejectInvoiceId, rejectionReason.trim());
  };

  const handleViewInvoice = async (invoiceId) => {
    setViewLoading(true);
    setShowViewModal(true);
    try {
      const data = await invoiceApi.getInvoice(invoiceId);
      setViewInvoiceData(data);
    } catch (err) {
      setError(`Failed to load invoice details: ${err.message}`);
      setShowViewModal(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewInvoiceData(null);
  };

  // File handling functions
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    if (uploadMode === 'single' && fileArray.length > 1) {
      setError('Please select only one file for single upload mode');
      return;
    }
    setSelectedFiles(fileArray);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadInvoice = async () => {
    if (!uploadInvoiceData.recipient) {
      setError('Please select a recipient');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    try {
      if (uploadMode === 'single') {
        // Single file upload
        const formData = new FormData();
        formData.append('recipient', uploadInvoiceData.recipient);
        formData.append('invoice_file', selectedFiles[0]);
        formData.append('status', uploadInvoiceData.status);
        formData.append('notes', uploadInvoiceData.notes);

        await invoiceDocumentApi.uploadInvoiceDocument(formData);
      } else {
        // Batch upload
        const formData = new FormData();
        formData.append('recipient', uploadInvoiceData.recipient);
        selectedFiles.forEach((file, index) => {
          formData.append(`files`, file);
        });
        formData.append('status', uploadInvoiceData.status);
        formData.append('notes', uploadInvoiceData.notes);

        await invoiceDocumentApi.batchUploadInvoiceDocuments(formData);
      }

      // Reset form
      setUploadInvoiceData({
        recipient: '',
        invoice_file: null,
        status: 'DRAFT',
        notes: ''
      });
      setSelectedFiles([]);
      setSelectedRecipient(null);
      setRecipientSearchTerm('');
      
      // Reload documents
      await loadInvoiceDocuments();
      
      setError(null);
      setSuccessMessage(`Invoice${selectedFiles.length > 1 ? 's' : ''} uploaded successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to upload invoice');
      console.error('Error uploading invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    showConfirmation(
      'Are you sure you want to delete this document? This action cannot be undone.',
      async () => {
        setLoading(true);
        try {
          await invoiceDocumentApi.deleteInvoiceDocument(documentId);
          await loadInvoiceDocuments();
          setSuccessMessage('Document deleted successfully!');
        } catch (err) {
          setError(err.message || 'Failed to delete document');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleUpdateDocumentStatus = async (documentId, newStatus) => {
    setLoading(true);
    try {
      await invoiceDocumentApi.updateDocumentStatus(documentId, newStatus);
      await loadInvoiceDocuments();
      setSuccessMessage(`Document status updated to ${newStatus}!`);
    } catch (err) {
      setError(err.message || 'Failed to update document status');
    } finally {
      setLoading(false);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { product_name: '', quantity: '1', rate: '0' }]
    }));
  };

  const removeInvoiceItem = (index) => {
    if (invoiceForm.items.length > 1) {
      setInvoiceForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const renderSidebar = () => (
    <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-4 lg:p-6">
      {/* Mobile: Horizontal scrolling navigation */}
      <div className="lg:hidden mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setActiveSection('generateStatement');
              setShowGeneralStatementTable(false);
            }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${
              activeSection === 'generateStatement'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Generate Statement
          </button>
          <button
            onClick={() => setActiveSection('uploadInvoice')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${
              activeSection === 'uploadInvoice'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upload Invoice
          </button>
          <button
            onClick={() => setActiveSection('createInvoice')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${
              activeSection === 'createInvoice'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => setActiveSection('acceptInvoice')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${
              activeSection === 'acceptInvoice'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Manage Invoices
          </button>
        </div>
      </div>

      {/* Desktop: Vertical navigation */}
      <div className="hidden lg:block">
        {/* Order Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              Refund/Return
              <span className="text-xs text-gray-400 ml-2">(Coming Soon)</span>
            </button>
            <button
              onClick={() => {
                setActiveSection('generateStatement');
                setShowGeneralStatementTable(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeSection === 'generateStatement'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Generate Statement
            </button>
          </div>
        </div>

        {/* Manage Invoice Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Invoice</h3>
          <div className="space-y-2">
            <button
              onClick={() => setActiveSection('uploadInvoice')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeSection === 'uploadInvoice'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Upload Invoice
            </button>
            <button
              onClick={() => setActiveSection('createInvoice')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeSection === 'createInvoice'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Create Invoice
            </button>
            <button
              onClick={() => setActiveSection('acceptInvoice')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeSection === 'acceptInvoice'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Manage Invoices
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenerateStatement = () => {
    const filteredStatements = statementHistory.filter(statement => {
      if (statementFilter === 'all') return true;
      if (statementFilter === 'created') return statement.created_by === 'current_user'; // You'll need to implement user check
      if (statementFilter === 'received') return statement.recipient === 'current_user'; // You'll need to implement user check
      return true;
    });

    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col space-y-4 mb-6 sm:mb-8 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Statement Management
          </h2>
          
          {/* Statement Filter Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStatementFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statementFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({statementHistory.length})
            </button>
            <button
              onClick={() => setStatementFilter('created')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statementFilter === 'created'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Created
            </button>
            <button
              onClick={() => setStatementFilter('received')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statementFilter === 'received'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Received
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <SuccessAlert 
            message={successMessage} 
            onClose={() => setSuccessMessage('')}
          />
        )}

        {/* Generate New Statement Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Generate New Statement</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Range */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={statementForm.start_date}
                  onChange={(e) => setStatementForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  value={statementForm.end_date}
                  onChange={(e) => setStatementForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Optional Parameters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                <select
                  value={statementForm.company || ''}
                  onChange={(e) => setStatementForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Companies</option>
                  {businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.company_name || business.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient (Optional)</label>
                <select
                  value={statementForm.recipient || ''}
                  onChange={(e) => setStatementForm(prev => ({ ...prev, recipient: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Specific Recipient</option>
                  {businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.company_name || business.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button 
              onClick={handleGenerateStatement}
              disabled={loading || !statementForm.start_date || !statementForm.end_date}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Statement'}
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={statementSearchTerm}
                onChange={(e) => {
                  setStatementSearchTerm(e.target.value);
                  handleSearchStatements(e.target.value);
                }}
                placeholder="Search by reference number or company name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setStatementSearchTerm('');
                loadStatementHistory();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Statements List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Statement History ({filteredStatements.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStatements.length > 0 ? filteredStatements.map((statement) => (
              <div key={statement.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-semibold">📊</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {statement.reference_number || 'Statement'}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {statement.atlas_wd_id}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(statement.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-medium text-blue-600">
                          ₦{parseFloat(statement.total_amount || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {statement.transaction_count} transactions
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Period: {new Date(statement.start_date).toLocaleDateString()} - {new Date(statement.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewStatement(statement.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteStatement(statement.id)}
                      disabled={loading}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-500">
                  {statementSearchTerm 
                    ? 'No statements found matching your search.' 
                    : 'No statements generated yet. Create your first statement above.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralStatement = () => (
    <div className="flex-1 p-8">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => setShowGeneralStatementTable(false)}
          className="mr-4 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">General Statement</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period Covered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                View History
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {statements.length > 0 ? (
              statements.map((statement, index) => (
                <tr key={statement.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {statement.company?.company_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Statement #{statement.reference_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{parseFloat(statement.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {statement.start_date} to {statement.end_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {statement.atlas_wd_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {statement.reference_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-800">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No statements found. Generate a statement to see data here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total Statements: {statements.length}
            </span>
            <div className="flex items-center space-x-4">
              <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                <option>10</option>
              </select>
              <span className="text-sm text-gray-700">per page</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">1 of 1 pages</span>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadInvoice = () => {
    const currentDocuments = documentFilter === 'sent' ? invoiceDocuments : receivedDocuments;
    
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col space-y-4 mb-6 sm:mb-8 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Upload Invoice Documents
          </h2>
          
          {/* Document Filter Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDocumentFilter('sent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                documentFilter === 'sent'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sent ({invoiceDocuments.length})
            </button>
            <button
              onClick={() => setDocumentFilter('received')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                documentFilter === 'received'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Received ({receivedDocuments.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <SuccessAlert 
            message={successMessage} 
            onClose={() => setSuccessMessage('')}
          />
        )}

        {/* Upload Section - Only show for sent documents */}
        {documentFilter === 'sent' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Upload New Document</h3>
              
              {/* Upload Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setUploadMode('single')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    uploadMode === 'single'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Single
                </button>
                <button
                  onClick={() => setUploadMode('batch')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    uploadMode === 'batch'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Batch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recipient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipient</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipientSearchTerm}
                    onChange={(e) => {
                      setRecipientSearchTerm(e.target.value);
                      debouncedCompanySearch(e.target.value, true);
                    }}
                    placeholder="Search for recipient..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* Recipient Search Results */}
                  {recipientOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {recipientOptions.map((company) => (
                        <div
                          key={company.id}
                          onClick={() => {
                            handleCompanySelect(company, true);
                            setUploadInvoiceData(prev => ({ ...prev, recipient: company.id }));
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {(company.company_name || company.full_name || 'C')[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {company.company_name || company.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {company.atlas_id}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Recipient Display */}
                  {selectedRecipient && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedRecipient.company_name || selectedRecipient.full_name}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRecipient(null);
                          setRecipientSearchTerm('');
                          setUploadInvoiceData(prev => ({ ...prev, recipient: '' }));
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={uploadInvoiceData.status}
                    onChange={(e) => setUploadInvoiceData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Send Immediately</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={uploadInvoiceData.notes}
                    onChange={(e) => setUploadInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this document..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files {uploadMode === 'batch' && '(Multiple files supported)'}
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="text-4xl text-gray-400">📄</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop files here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, JPG, PNG files up to 10MB each
                    </p>
                  </div>
                  
                  <input
                    type="file"
                    multiple={uploadMode === 'batch'}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Choose Files
                  </label>
                </div>
              </div>

              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">📄</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUploadInvoice}
                disabled={loading || !uploadInvoiceData.recipient || selectedFiles.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : `Upload ${selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}`}
              </button>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {documentFilter === 'sent' ? 'Sent Documents' : 'Received Documents'} ({currentDocuments.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {currentDocuments.length > 0 ? currentDocuments.map((document) => (
              <div key={document.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">📄</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.original_filename || 'Invoice Document'}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          document.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          document.status === 'SENT' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {document.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(document.created_at).toLocaleDateString()}
                        </span>
                        {document.recipient_details && (
                          <span className="text-xs text-gray-500">
                            To: {document.recipient_details.company_name || document.recipient_details.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {document.invoice_file && (
                      <a
                        href={document.invoice_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        View
                      </a>
                    )}
                    
                    {documentFilter === 'sent' && document.status === 'DRAFT' && (
                      <button
                        onClick={() => handleUpdateDocumentStatus(document.id, 'SENT')}
                        disabled={loading}
                        className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-600 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        Send
                      </button>
                    )}
                    
                    {documentFilter === 'sent' && (
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        disabled={loading}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                
                {document.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                    <strong>Notes:</strong> {document.notes}
                  </div>
                )}
              </div>
            )) : (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">📄</div>
                <p className="text-gray-500">
                  {documentFilter === 'sent' 
                    ? 'No documents uploaded yet. Upload your first invoice document above.' 
                    : 'No documents received yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateInvoice = () => (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-8">Create Invoice</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error.includes('\n') ? (
                  <ul className="list-disc list-inside space-y-1">
                    {error.split('\n').map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <SuccessAlert 
          message={successMessage} 
          onClose={() => setSuccessMessage('')}
        />
      )}
      
      <div className="space-y-6">
        {/* Company Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
          <div className="relative">
            <input
              type="text"
              value={companySearchTerm}
              onChange={(e) => {
                setCompanySearchTerm(e.target.value);
                debouncedCompanySearch(e.target.value, false);
              }}
              placeholder="Search for company..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            
            {/* Company Search Results */}
            {companyOptions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {companyOptions.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => handleCompanySelect(company, false)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {(company.company_name || company.full_name || 'C')[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {company.company_name || company.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {company.atlas_id} • {company.business_type}
                        </div>
                        {company.business_verification_status === 'VERIFIED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected Company Display */}
            {selectedCompany && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">
                    Selected: {selectedCompany.company_name || selectedCompany.full_name}
                  </span>
                  <span className="text-xs text-blue-600">({selectedCompany.atlas_id})</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCompany(null);
                    setCompanySearchTerm('');
                    setInvoiceForm(prev => ({ ...prev, company: '' }));
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product/Services Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Product/Services Details</label>
          <div className="space-y-4">
            {invoiceForm.items.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Products by {selectedCompany?.company_name || selectedCompany?.full_name || 'Company'}
                  </label>
                  <input 
                    type="text" 
                    value={item.product_name}
                    onChange={(e) => updateInvoiceItem(index, 'product_name', e.target.value)}
                    placeholder="Enter product name"
                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                    min="1"
                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Unit Amount (₦)</label>
                  <input 
                    type="number" 
                    value={item.rate}
                    onChange={(e) => updateInvoiceItem(index, 'rate', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Total</label>
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      value={`₦${(parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toLocaleString()}`}
                      readOnly
                      className="w-full px-2 py-1 border rounded text-sm bg-gray-50" 
                    />
                    {invoiceForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={addInvoiceItem}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Another Item
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg">
              <span className="font-medium">Subtotal</span>
              <span className="font-medium">₦{calculateInvoiceTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Upload Supporting Document - Hidden */}
        {false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Supporting Document (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="supporting_document"
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, supporting_document: e.target.files[0] }))}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="supporting_document" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-800">+ Upload Document</span>
                {invoiceForm.supporting_document && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {invoiceForm.supporting_document.name}
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Additional Charges */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Charges (Optional)</label>
          <input
            type="number"
            value={invoiceForm.additional_charges}
            onChange={(e) => setInvoiceForm(prev => ({ ...prev, additional_charges: e.target.value }))}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between">
              <span className="font-medium">Final Total</span>
              <span className="font-medium">₦{(calculateInvoiceTotal() + parseFloat(invoiceForm.additional_charges || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
          <select 
            value={invoiceForm.payment_mode}
            onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_mode: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        {/* Transaction Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date *</label>
          <input
            type="date"
            value={invoiceForm.transaction_date}
            onChange={(e) => setInvoiceForm(prev => ({ ...prev, transaction_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
          <input
            type="text"
            value={invoiceForm.reference_number}
            onChange={(e) => setInvoiceForm(prev => ({ ...prev, reference_number: e.target.value }))}
            placeholder="Auto-generated if left empty"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Logistics Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Logistics Information *</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver's Name *</label>
              <input
                type="text"
                value={invoiceForm.driver_name}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, driver_name: e.target.value }))}
                placeholder="Enter driver's name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver's Contact *</label>
              <input
                type="tel"
                value={invoiceForm.driver_contact}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, driver_contact: e.target.value }))}
                placeholder="+234801234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number *</label>
              <input
                type="text"
                value={invoiceForm.vehicle_number}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, vehicle_number: e.target.value }))}
                placeholder="ABC-123-XY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
          <textarea
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes or instructions..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4 pt-6">
          <button 
            onClick={handleCreateInvoice}
            disabled={loading}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
          <button className="px-8 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );

  // Get filtered invoices based on current filter
  const getFilteredInvoices = () => {
    switch (invoiceFilter) {
      case 'pending':
        return pendingInvoices;
      case 'accepted':
        return acceptedInvoices;
      case 'rejected':
        return rejectedInvoices;
      default:
        return receivedInvoices;
    }
  };

  const renderAcceptInvoice = () => {
    const filteredInvoices = getFilteredInvoices();
    
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col space-y-4 mb-6 sm:mb-8 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Manage Invoices ({filteredInvoices.length})
          </h2>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 sm:flex-nowrap">
            <button
              onClick={() => setInvoiceFilter('all')}
              className={`px-2 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                invoiceFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({receivedInvoices.length})
            </button>
            <button
              onClick={() => setInvoiceFilter('pending')}
              className={`px-2 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                invoiceFilter === 'pending'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pendingInvoices.length})
            </button>
            <button
              onClick={() => setInvoiceFilter('accepted')}
              className={`px-2 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                invoiceFilter === 'accepted'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Accepted ({acceptedInvoices.length})
            </button>
            <button
              onClick={() => setInvoiceFilter('rejected')}
              className={`px-2 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                invoiceFilter === 'rejected'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({rejectedInvoices.length})
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-4 sm:space-y-6">
          {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-white rounded-lg shadow border space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm sm:text-lg">
                    {(invoice.company_details?.company_name || 'C')[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                    {invoice.company_details?.company_name || 'Unknown Company'}
                  </h3>
                  <p className="text-blue-600 text-sm sm:text-base font-medium">
                    ₦{parseFloat(invoice.final_total || invoice.total_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm truncate">
                    Ref: {invoice.reference_number}
                  </p>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
                <button 
                  onClick={() => handleViewInvoice(invoice.id)}
                  className="px-4 py-2 sm:px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  View
                </button>
                {invoice.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => openRejectModal(invoice.id)}
                      disabled={loading}
                      className="px-4 py-2 sm:px-6 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAcceptInvoice(invoice.id)}
                      disabled={loading}
                      className="px-4 py-2 sm:px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      {loading ? 'Processing...' : 'Accept'}
                    </button>
                  </>
                )}
                {invoice.status === 'ACCEPTED' && (
                  <div className="px-4 py-2 sm:px-6 bg-green-100 text-green-800 rounded-lg text-center text-sm sm:text-base">
                    ✓ Accepted
                  </div>
                )}
                {invoice.status === 'REJECTED' && (
                  <div className="px-4 py-2 sm:px-6 bg-red-100 text-red-800 rounded-lg text-center text-sm sm:text-base">
                    ✗ Rejected
                  </div>
                )}
              </div>
            </div>
        )) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📄</div>
            <p className="text-gray-500">
              {invoiceFilter === 'pending' ? 'No pending invoices to review' :
               invoiceFilter === 'accepted' ? 'No accepted invoices found' :
               invoiceFilter === 'rejected' ? 'No rejected invoices found' :
               'No invoices found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderMainContent = () => {
    if (showGeneralStatementTable) {
      return renderGeneralStatement();
    }
    
    switch (activeSection) {
      case 'generateStatement':
        return renderGenerateStatement();
      case 'uploadInvoice':
        return renderUploadInvoice();
      case 'createInvoice':
        return renderCreateInvoice();
      case 'acceptInvoice':
        return renderAcceptInvoice();
      default:
        return renderGenerateStatement();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {renderSidebar()}
      {renderMainContent()}
      
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Invoice
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this invoice:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Invoice Details
              </h3>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {viewLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : viewInvoiceData ? (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reference Number</label>
                    <p className="text-gray-900">{viewInvoiceData.reference_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      viewInvoiceData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      viewInvoiceData.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {viewInvoiceData.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    <p className="text-gray-900">{viewInvoiceData.company_details?.company_name || 'Unknown Company'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transaction Date</label>
                    <p className="text-gray-900">{new Date(viewInvoiceData.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Driver Details */}
                {viewInvoiceData.driver_name && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Driver Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{viewInvoiceData.driver_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact</label>
                        <p className="text-gray-900">{viewInvoiceData.driver_contact}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Vehicle Number</label>
                        <p className="text-gray-900">{viewInvoiceData.vehicle_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Mode</label>
                        <p className="text-gray-900">{viewInvoiceData.payment_mode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Invoice Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Product</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Quantity</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Rate</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewInvoiceData.items?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-2 text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-gray-900">₦{parseFloat(item.rate).toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-900">₦{(parseFloat(item.quantity) * parseFloat(item.rate)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">₦{parseFloat(viewInvoiceData.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {viewInvoiceData.additional_charges > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Additional Charges:</span>
                      <span className="text-gray-900">₦{parseFloat(viewInvoiceData.additional_charges).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">₦{parseFloat(viewInvoiceData.final_total || viewInvoiceData.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Notes */}
                {viewInvoiceData.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-900 mt-1">{viewInvoiceData.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Failed to load invoice details</p>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
              </div>
              <p className="text-gray-600 mb-6">{confirmMessage}</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement Details Modal */}
      {showStatementDetails && selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Statement Details</h3>
                <button
                  onClick={() => {
                    setShowStatementDetails(false);
                    setSelectedStatement(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Statement Header */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-blue-900">Reference Number</h4>
                      <p className="text-blue-800">{selectedStatement.reference_number}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Atlas WD ID</h4>
                      <p className="text-blue-800">{selectedStatement.atlas_wd_id}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Period</h4>
                      <p className="text-blue-800">
                        {new Date(selectedStatement.start_date).toLocaleDateString()} - {new Date(selectedStatement.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Generated On</h4>
                      <p className="text-blue-800">{new Date(selectedStatement.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Financial Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-800">
                        ₦{parseFloat(selectedStatement.total_amount || 0).toLocaleString()}
                      </p>
                      <p className="text-green-600">Total Amount</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-800">{selectedStatement.transaction_count}</p>
                      <p className="text-green-600">Total Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-800">
                        ₦{(parseFloat(selectedStatement.total_amount || 0) / (selectedStatement.transaction_count || 1)).toLocaleString()}
                      </p>
                      <p className="text-green-600">Average per Transaction</p>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                {selectedStatement.company_details && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Company Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-700">Company Name</p>
                        <p className="text-gray-600">{selectedStatement.company_details.company_name || selectedStatement.company_details.full_name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Atlas ID</p>
                        <p className="text-gray-600">{selectedStatement.company_details.atlas_id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipient Information */}
                {selectedStatement.recipient_details && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Recipient Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-700">Recipient Name</p>
                        <p className="text-gray-600">{selectedStatement.recipient_details.company_name || selectedStatement.recipient_details.full_name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Atlas ID</p>
                        <p className="text-gray-600">{selectedStatement.recipient_details.atlas_id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Details Section */}
                {selectedStatement.invoice_details && selectedStatement.invoice_details.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">
                      Invoice Transactions ({selectedStatement.invoice_details.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedStatement.invoice_details.map((invoice, index) => (
                        <div key={invoice.id || index} className="bg-white rounded-lg p-3 border border-orange-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <p className="font-medium text-orange-900 text-sm">Invoice ID</p>
                              <p className="text-orange-800 text-xs">{invoice.atlas_wd_id}</p>
                              <p className="text-orange-700 text-xs">{invoice.reference_number}</p>
                            </div>
                            <div>
                              <p className="font-medium text-orange-900 text-sm">Company & Amount</p>
                              <p className="text-orange-800 text-sm">{invoice.company}</p>
                              <p className="text-orange-700 font-semibold">₦{parseFloat(invoice.amount).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-medium text-orange-900 text-sm">Status & Date</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                invoice.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {invoice.status}
                              </span>
                              <p className="text-orange-700 text-xs mt-1">{new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {invoice.description && (
                            <div className="mt-2 pt-2 border-t border-orange-200">
                              <p className="text-orange-700 text-xs">{invoice.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet Transaction Details Section */}
                {selectedStatement.wallet_transaction_details && selectedStatement.wallet_transaction_details.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">
                      Wallet Transactions ({selectedStatement.wallet_transaction_details.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedStatement.wallet_transaction_details.map((transaction, index) => (
                        <div key={transaction.id || index} className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <p className="font-medium text-purple-900 text-sm">Transaction Type</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                transaction.transaction_type === 'deposit' ? 'bg-green-100 text-green-800' :
                                transaction.transaction_type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.transaction_type?.toUpperCase()}
                              </span>
                              <p className="text-purple-700 text-xs mt-1">{new Date(transaction.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="font-medium text-purple-900 text-sm">Amount & Balance</p>
                              <p className={`font-semibold ${
                                transaction.transaction_type === 'deposit' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {transaction.transaction_type === 'deposit' ? '+' : '-'}₦{parseFloat(transaction.amount).toLocaleString()}
                              </p>
                              <p className="text-purple-700 text-xs">Balance: ₦{parseFloat(transaction.balance_after).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-medium text-purple-900 text-sm">Status</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {transaction.description && (
                            <div className="mt-2 pt-2 border-t border-purple-200">
                              <p className="text-purple-700 text-xs">{transaction.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Transactions Chronological View */}
                {selectedStatement.all_transactions && selectedStatement.all_transactions.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">
                      All Transactions - Chronological View ({selectedStatement.all_transactions.length})
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {selectedStatement.all_transactions.map((transaction, index) => (
                        <div key={transaction.id || index} className="bg-white rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  transaction.type === 'invoice' ? 'bg-orange-400' :
                                  transaction.type === 'wallet' ? 'bg-purple-400' :
                                  'bg-blue-400'
                                }`}></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-900">
                                    {transaction.description || 
                                     (transaction.type === 'invoice' ? `Invoice - ${transaction.company || 'N/A'}` : 
                                      transaction.type === 'wallet' ? `Wallet ${transaction.transaction_type}` : 
                                      'Transaction')}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(transaction.date).toLocaleDateString()} • 
                                    {transaction.atlas_wd_id || transaction.reference_number || `ID: ${transaction.id}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold text-sm ${
                                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}₦{Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                              </p>
                              {transaction.status && (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                  transaction.status === 'ACCEPTED' || transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'PENDING' || transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">
                        <span className="inline-flex items-center mr-4">
                          <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                          Invoice Transactions
                        </span>
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                          Wallet Transactions
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowStatementDetails(false);
                      setSelectedStatement(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleExportStatement(selectedStatement)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionActivities;
