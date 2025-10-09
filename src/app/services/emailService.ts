
import { winstonLogger } from '../../loaders/logger';
import { emailSenderTemplate } from '../utils/emailUtils';

const sendVerificationEmail = async (email: string, validationCode: string) => {
  try {
    // Create sendEmail params
    const templateData = {
      name: email,
      appName: 'TECHSCRUMAPP',
      url: 'verify',
      token: validationCode,
      color: '#7291F7',
      border: '5px solid #7291F7',
      year: '2022',
      project: 'abc',
    };
    
    const result = await emailSenderTemplate(email, templateData, 'CustomEmailVerify');
    winstonLogger.info(`Email Sent Success: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    winstonLogger.error(`Failed to send email: ${error}`);
    throw error;
  }
};

export default { sendVerificationEmail };