
import { winstonLogger } from '../../loaders/logger';
import { emailSenderTemplate } from '../utils/emailUtils';

function cb(email_err: any, email_data: any): void {
  if (email_err) {
    winstonLogger.error('Failed to send to email:' + email_err);
  } else {
    winstonLogger.info(`Email Sent Success: ${JSON.stringify(email_data)}`);
  }
}

const sendVerificationEmail = async (email: string, validationCode: string) => {
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
  emailSenderTemplate(email, templateData, 'CustomEmailVerify', cb);
};

export default { sendVerificationEmail };