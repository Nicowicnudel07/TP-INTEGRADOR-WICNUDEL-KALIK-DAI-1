// test-supabase.js
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details - replace with your actual values
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test function to verify connection
async function testConnection() {
  try {
    // A simple query to test the connection
    const { data, error } = await supabase
      .from('your_table_name')  // Replace with an actual table in your Supabase project
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Connection successful!');
    console.log('Data retrieved:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error during connection test:', err);
    return false;
  }
}

// Run the test
testConnection()
  .then(isConnected => {
    if (isConnected) {
      console.log('Supabase connection is working properly.');
    } else {
      console.log('Failed to establish Supabase connection. Check your credentials and network.');
    }
  });

// You can export the initialized client for use in other parts of your application
module.exports = {
  supabase,
  testConnection
};