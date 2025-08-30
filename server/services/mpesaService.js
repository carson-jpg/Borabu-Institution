const axios = require('axios');
const crypto = require('crypto');

// M-Pesa API configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  baseUrl: process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
};

// Generate M-Pesa access token
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');

    const response = await axios.get(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

// Generate password for STK push
function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
  return { password, timestamp };
}

// Initiate STK Push
async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc = 'Fee Payment') {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    };

    const response = await axios.post(`${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage
    };

  } catch (error) {
    console.error('Error initiating STK push:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message
    };
  }
}

// Query STK Push status
async function querySTKPush(checkoutRequestId) {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(`${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc
    };

  } catch (error) {
    console.error('Error querying STK push:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message
    };
  }
}

// Validate M-Pesa callback
function validateCallback(body) {
  // In production, you should validate the callback using the M-Pesa public key
  // For now, we'll just check if the required fields are present
  return body && body.Body && body.Body.stkCallback;
}

// Process M-Pesa callback
function processCallback(callbackData) {
  const stkCallback = callbackData.Body.stkCallback;

  return {
    merchantRequestId: stkCallback.MerchantRequestID,
    checkoutRequestId: stkCallback.CheckoutRequestID,
    resultCode: stkCallback.ResultCode,
    resultDesc: stkCallback.ResultDesc,
    callbackMetadata: stkCallback.CallbackMetadata || null,
    // Extract payment details if successful
    ...(stkCallback.CallbackMetadata && {
      amount: stkCallback.CallbackMetadata.Item.find(item => item.Name === 'Amount')?.Value,
      mpesaReceiptNumber: stkCallback.CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber')?.Value,
      transactionDate: stkCallback.CallbackMetadata.Item.find(item => item.Name === 'TransactionDate')?.Value,
      phoneNumber: stkCallback.CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber')?.Value
    })
  };
}

module.exports = {
  getAccessToken,
  initiateSTKPush,
  querySTKPush,
  validateCallback,
  processCallback
};
