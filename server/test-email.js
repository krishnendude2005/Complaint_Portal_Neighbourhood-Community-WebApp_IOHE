import dotenv from 'dotenv';
import { testEmailConnection, sendInvitationEmail } from './utils/email.js';

// Load environment variables
dotenv.config();

async function testEmail() {
  try {
    console.log('Testing email connection...');
    await testEmailConnection();
    console.log('✅ Email configuration is valid!');

    // Optional: Send a test email
    if (process.env.SEND_TEST_EMAIL === 'true') {
      console.log('\nSending test email...');
      const testEmailTo = process.env.TEST_EMAIL_TO || 'test@example.com';
      const testLink = 'http://localhost:5173/accept-invitation?token=test123';

      await sendInvitationEmail(
        testEmailTo,
        testLink,
        'Test Society',
        'Test Admin'
      );
      console.log('✅ Test email sent successfully!');
    }
  } catch (error) {
    console.error('❌ Email configuration error:');
    console.error(error.message);
    console.log('\nTo configure email:');
    console.log('1. Edit the .env file in the server directory');
    console.log('2. Choose ONE method:');
    console.log('   - Ethereal (free test emails): Get credentials from https://ethereal.email');
    console.log('   - Gmail: Use an app password (not your regular password)');
    console.log('   - Other SMTP: Get credentials from your email provider');
    console.log('3. Uncomment and fill in the appropriate variables');
    console.log('4. Set SEND_TEST_EMAIL=true to send a test email');
    process.exit(1);
  }
}

testEmail();
