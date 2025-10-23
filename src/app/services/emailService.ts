import { winstonLogger } from '../../loaders/logger';
import { emailSenderTemplate } from '../utils/emailUtils';
import config from '../config/app';

const sendVerificationEmail = async (email: string, validationCode: string) => {
  try {
    // Check if email validation is bypassed
    if (config.bypassEmailValidation) {
      winstonLogger.info(
        `Email sending bypassed for: ${email} (validation code: ${validationCode})`,
      );
      return {
        MessageId: 'bypassed-email-validation',
        bypassed: true,
        email,
        validationCode,
      };
    }

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

    const result = await emailSenderTemplate(
      email,
      templateData,
      'CustomEmailVerify',
    );
    winstonLogger.info(`Email Sent Success: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    winstonLogger.error(`Failed to send email: ${error}`);
    throw error;
  }
};

export default { sendVerificationEmail };
